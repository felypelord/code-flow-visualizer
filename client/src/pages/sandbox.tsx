import Layout from "@/components/layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import CodeEditor from "@/components/code-editor";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { createWorkerController } from "@/lib/sandbox";
import { useToast } from "@/hooks/use-toast";
import type { HeapObject, StackFrame, Variable } from "@/lib/types";
import { runPythonTrace, type PythonTraceResult } from "@/lib/python-trace";

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// Paste your code here\n// Example (calls + heap mutations):\n\nfunction add1(n) {\n  const out = n + 1;\n  return out;\n}\n\nlet arr = [1, 2, 3];\narr[0] = 99;\n\nlet obj = { a: 1 };\nobj.a = add1(arr[0]);\n\nconsole.log(obj);`,
  python: `# Paste your code here\n# Example:\nx = 1\nx = x + 2\nprint(x)`,
  java: `// Paste your code here\n// Example:\nclass Main {\n  public static void main(String[] args) {\n    int x = 1;\n    x = x + 2;\n    System.out.println(x);\n  }\n}`,
  csharp: `// Paste your code here\n// Example:\nusing System;\n\nclass Program {\n  static void Main() {\n    int x = 1;\n    x = x + 2;\n    Console.WriteLine(x);\n  }\n}`,
  c: `// Paste your code here\n// Example:\n#include <stdio.h>\n\nint main() {\n  int x = 1;\n  x = x + 2;\n  printf("%d\\n", x);\n  return 0;\n}`,
};

function guessIsJavaScript(lang: string) {
  return String(lang || "").toLowerCase() === "javascript";
}

function makeExplanationForLine(
  lineText: string,
  lang: string,
  t: (key: string, fallback: string, options?: any) => string,
) {
  const s = (lineText || "").trim();
  const l = String(lang || "").toLowerCase();

  if (!s) return t("sandbox.explain.blank", "Blank line.");

  // Comments
  if (s.startsWith("//") || s.startsWith("#")) return t("sandbox.explain.comment", "Comment.");
  if (s.startsWith("/*") || s.startsWith("*") || s.startsWith("*/")) return t("sandbox.explain.comment", "Comment.");

  // Imports / includes
  if (/^import\b/.test(s) || /^from\b.+\bimport\b/.test(s) || /^using\b/.test(s) || /^#include\b/.test(s)) {
    return t("sandbox.explain.import", "Import / include statement.");
  }

  // Class / type definitions
  if (/^class\b/.test(s) || /^struct\b/.test(s)) {
    return t("sandbox.explain.class", "Class / type definition.");
  }

  // Function definitions
  if (/\bfunction\b/.test(s) || /=>/.test(s) || /^def\b/.test(s) || /\bstatic\s+void\s+main\b/.test(s)) {
    return t("sandbox.explain.function", "Function definition.");
  }

  // Control flow
  if (/^(if|else\s+if|else)\b/.test(s)) return t("sandbox.explain.conditional", "Conditional branch evaluation.");
  if (/^(for|while|do)\b/.test(s)) return t("sandbox.explain.loop", "Loop evaluation.");
  if (/^return\b/.test(s)) return t("sandbox.explain.return", "Return statement.");

  // Output
  const isOutput =
    /\bconsole\.(log|error|warn)\b/.test(s) ||
    /\bprint\s*\(/.test(s) ||
    /\bSystem\.out\.(println|print)\b/.test(s) ||
    /\bConsole\.(WriteLine|Write)\b/.test(s) ||
    /\bprintf\s*\(/.test(s) ||
    /\bputs\s*\(/.test(s) ||
    /\bfprintf\s*\(/.test(s);
  if (isOutput) return t("sandbox.explain.output", "Output statement.");

  // Variable declarations (rough heuristics)
  if (l.includes("javascript") && /^(let|const|var)\b/.test(s)) {
    return t("sandbox.explain.declaration", "Variable declaration.");
  }
  if (l.includes("python") && /^[a-zA-Z_][\w_]*\s*=/.test(s)) {
    return t("sandbox.explain.assignment", "Assignment / evaluation.");
  }
  if ((l.includes("java") || l.includes("csharp") || l === "c") && /^(?:public\s+|private\s+|protected\s+|static\s+)?(?:final\s+)?(int|long|short|byte|float|double|bool|boolean|char|string|String|var)\b/.test(s)) {
    return t("sandbox.explain.declaration", "Variable declaration.");
  }
  if (l === "c" && /^(unsigned\s+)?(int|long|short|char|float|double|size_t)\b/.test(s)) {
    return t("sandbox.explain.declaration", "Variable declaration.");
  }

  // Generic assignment/evaluation
  if (/=/.test(s)) return t("sandbox.explain.assignment", "Assignment / evaluation.");

  return t("sandbox.explain.executing", "Executing line.");
}

function basicSyntaxCheck(source: string, lang: string): string | null {
  const code = String(source || "");
  const l = String(lang || "").toLowerCase();

  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let escaped = false;

  let inLineComment = false;
  let inBlockComment = false;

  let paren = 0;
  let brace = 0;
  let bracket = 0;

  const supportsHashComments = l.includes("python");

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    // String handling (very lightweight)
    if (inSingle || inDouble || inBacktick) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (inSingle && ch === "'") inSingle = false;
      else if (inDouble && ch === '"') inDouble = false;
      else if (inBacktick && ch === "`") inBacktick = false;
      continue;
    }

    // Comment start
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (supportsHashComments && ch === "#") {
      inLineComment = true;
      continue;
    }

    // String start
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      continue;
    }

    // Balance checks
    if (ch === "(") paren++;
    else if (ch === ")") paren--;
    else if (ch === "{") brace++;
    else if (ch === "}") brace--;
    else if (ch === "[") bracket++;
    else if (ch === "]") bracket--;

    if (paren < 0) return "Unexpected ')'";
    if (brace < 0) return "Unexpected '}'";
    if (bracket < 0) return "Unexpected ']'";
  }

  if (inSingle) return "Unclosed single quote (')";
  if (inDouble) return 'Unclosed double quote (")';
  if (inBacktick) return "Unclosed template string (`)";
  if (inBlockComment) return "Unclosed block comment (/* ... */)";
  if (paren !== 0) return "Unbalanced parentheses";
  if (brace !== 0) return "Unbalanced braces";
  if (bracket !== 0) return "Unbalanced brackets";
  return null;
}

function stripTrailingSemicolon(s: string) {
  return String(s || "").replace(/;\s*$/, "").trim();
}

function looksLikeReference(value: string) {
  const v = String(value || "").trim();
  if (!v) return false;
  if (v.startsWith("{") || v.startsWith("[") || v.startsWith("(")) return true;
  if (/^new\s+\w+/.test(v)) return true;
  if (/\b(dict|list|set|map)\s*\(/i.test(v)) return true;
  return false;
}

function parseSimpleLiteral(value: string): { kind: "primitive" | "reference"; primitive?: string | number | boolean | null; props?: Array<{ name: string; value: string }>; className?: string } {
  const v = String(value || "").trim();
  if (!v) return { kind: "primitive", primitive: "" };

  if (/^(true|false)$/i.test(v)) return { kind: "primitive", primitive: /^true$/i.test(v) };
  if (/^(null|none)$/i.test(v)) return { kind: "primitive", primitive: null };

  if (/^[+-]?(\d+\.?\d*|\d*\.\d+)$/.test(v)) {
    const n = Number(v);
    return { kind: "primitive", primitive: Number.isFinite(n) ? n : v };
  }

  const quoted = v.match(/^(['"])(.*)\1$/);
  if (quoted) return { kind: "primitive", primitive: quoted[2] };

  if (v.startsWith("[") && v.endsWith("]")) {
    const inside = v.slice(1, -1).trim();
    const items = inside ? inside.split(/\s*,\s*/).slice(0, 8) : [];
    return {
      kind: "reference",
      className: "Array",
      props: items.map((it, idx) => ({ name: String(idx), value: stripTrailingSemicolon(it) })),
    };
  }

  if (v.startsWith("{") && v.endsWith("}")) {
    const inside = v.slice(1, -1).trim();
    const pairs = inside ? inside.split(/\s*,\s*/).slice(0, 8) : [];
    const props = pairs
      .map((p) => {
        const parts = p.split(/\s*[:=]\s*/);
        if (parts.length < 2) return null;
        const key = parts[0].replace(/^['"]|['"]$/g, "").trim();
        const val = stripTrailingSemicolon(parts.slice(1).join(":"));
        if (!key) return null;
        return { name: key, value: val };
      })
      .filter(Boolean) as Array<{ name: string; value: string }>;
    return { kind: "reference", className: "Object", props };
  }

  return looksLikeReference(v)
    ? { kind: "reference", className: "Object", props: [] }
    : { kind: "primitive", primitive: v };
}

function parseAssignmentLike(line: string, lang: string): { name: string; value: string; op?: string; declared?: boolean } | null {
  const s = stripTrailingSemicolon(String(line || "").trim());
  if (!s) return null;
  if (/^(#|\/\/|\/\*|\*|\}|\]|\)|else\b|catch\b|finally\b)/.test(s)) return null;

  let m = s.match(/^(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*(?:=\s*(.+))?$/);
  if (m) return { name: m[1], value: stripTrailingSemicolon(m[2] ?? "undefined"), op: "=", declared: true };

  if (String(lang || "").toLowerCase().includes("python")) {
    m = s.match(/^([a-zA-Z_][\w_]*)\s*(=|\+=|-=|\*=|\/=|%=)\s*(.+)$/);
    if (m) return { name: m[1], op: m[2], value: stripTrailingSemicolon(m[3]) };
  }

  m = s.match(/^(?:public\s+|private\s+|protected\s+|static\s+|final\s+)*([A-Za-z_][\w<>\[\]]*)\s+([A-Za-z_][\w_]*)\s*(?:=\s*(.+))?$/);
  if (m && m[2] && m[1] && !/^(return|if|for|while|switch|case|break|continue|class|struct|using|import|from)$/.test(m[1])) {
    return { name: m[2], value: stripTrailingSemicolon(m[3] ?? "0"), op: "=", declared: true };
  }

  m = s.match(/^([a-zA-Z_$][\w$]*)\s*(=|\+=|-=|\*=|\/=|%=)\s*(.+)$/);
  if (m) return { name: m[1], op: m[2], value: stripTrailingSemicolon(m[3]) };

  m = s.match(/^([a-zA-Z_$][\w$]*)\s*(\+\+|--)$/);
  if (m) return { name: m[1], op: m[2], value: "" };

  return null;
}

type SimFrame = {
  id: string;
  name: string;
  vars: Record<string, Variable>;
  // Python: pop when indentation returns to/below this level
  indentLevel?: number;
  // C-like: pop when brace depth returns to/below this level
  exitBraceDepth?: number;
  // Temporary frame used to visualize a single function call line
  temporary?: boolean;
  popAfterLine?: number;
};

function isBlankOrCommentLine(line: string, lang: string) {
  const s = String(line || "").trim();
  if (!s) return true;
  if (s.startsWith("//") || s.startsWith("/*") || s.startsWith("*") || s.startsWith("*/")) return true;
  if (String(lang || "").toLowerCase().includes("python") && s.startsWith("#")) return true;
  return false;
}

function countLeadingIndent(line: string) {
  const m = String(line || "").match(/^\s*/);
  const raw = m ? m[0] : "";
  // Tabs count as 4 for this heuristic
  return raw.replace(/\t/g, "    ").length;
}

function countBraces(line: string) {
  const s = String(line || "");
  let open = 0;
  let close = 0;
  // Very lightweight: ignore quote handling; good enough for simulation.
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{") open++;
    else if (s[i] === "}") close++;
  }
  return { open, close };
}

function extractFunctionNameCStyle(line: string) {
  const s = String(line || "").trim();
  if (!s.includes("(") || !s.includes(")") || !s.includes("{")) return null;
  if (/^(if|for|while|switch|catch|foreach)\b/.test(s)) return null;
  // pick the identifier right before the first '(' (best-effort)
  const m = s.match(/([A-Za-z_][\w]*)\s*\(/);
  if (!m) return null;
  const name = m[1];
  if (!name) return null;
  if (/^(if|for|while|switch|return|new)$/.test(name)) return null;
  return name;
}

function extractFunctionNamePython(line: string) {
  const s = String(line || "").trim();
  const m = s.match(/^def\s+([A-Za-z_][\w_]*)\s*\(/);
  return m ? m[1] : null;
}

function extractAssignedCallInfo(line: string, lang: string): { target: string; name: string; args: string[] } | null {
  const s = stripTrailingSemicolon(String(line || "").trim());
  if (!s) return null;
  // ignore obvious control flow
  if (/^(if|for|while|switch|catch|return|break|continue|else)\b/.test(s)) return null;
  // ignore output-like calls
  if (/\b(print|console\.(log|warn|error)|System\.out\.(print|println)|Console\.(Write|WriteLine)|printf)\s*\(/.test(s)) return null;

  // JS: let x = foo(...)
  let m = s.match(/^(?:let|const|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_][\w_]*)\s*\((.*)\)\s*$/);
  if (!m) {
    // Generic: x = foo(...)
    m = s.match(/^([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_][\w_]*)\s*\((.*)\)\s*$/);
  }
  if (!m) return null;
  const target = m[1];
  const name = m[2];
  const argsRaw = String(m[3] || "").trim();
  const args = argsRaw
    ? argsRaw
        .split(/\s*,\s*/)
        .map((a) => stripTrailingSemicolon(a))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  return { target, name, args };
}

function extractFunctionCallInfo(line: string, lang: string): { name: string; args: string[] } | null {
  const s = stripTrailingSemicolon(String(line || "").trim());
  if (!s) return null;
  // ignore definitions and obvious control flow
  if (/^def\b/.test(s) || /^class\b/.test(s) || /\bfunction\b/.test(s)) return null;
  if (/^(if|for|while|switch|catch|return|break|continue|else)\b/.test(s)) return null;
  // ignore assignments (handled elsewhere)
  if (/=/.test(s) && !/==/.test(s)) return null;
  // ignore output-like calls
  if (/\b(print|console\.(log|warn|error)|System\.out\.(print|println)|Console\.(Write|WriteLine)|printf)\s*\(/.test(s)) return null;

  // find a leading function call: foo(...)
  const m = s.match(/^([A-Za-z_][\w_]*)\s*\((.*)\)\s*$/);
  if (!m) return null;
  const name = m[1];
  if (!name) return null;
  const argsRaw = String(m[2] || "").trim();
  const args = argsRaw
    ? argsRaw
        .split(/\s*,\s*/)
        .map((a) => stripTrailingSemicolon(a))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  // python allows builtins; we still show it, but avoid some keywords
  if (/^(if|for|while|return|new)$/.test(name)) return null;
  return { name, args };
}

function parseMutationLike(line: string):
  | { kind: "index"; base: string; key: string; value: string }
  | { kind: "prop"; base: string; key: string; value: string }
  | null {
  const s = stripTrailingSemicolon(String(line || "").trim());
  if (!s) return null;

  // arr[0] = ... or obj["k"] = ...
  let m = s.match(/^([A-Za-z_$][\w$]*)\s*\[\s*([^\]]+)\s*\]\s*=\s*(.+)$/);
  if (m) return { kind: "index", base: m[1], key: stripTrailingSemicolon(m[2]), value: stripTrailingSemicolon(m[3]) };

  // obj.prop = ...
  m = s.match(/^([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)\s*=\s*(.+)$/);
  if (m) return { kind: "prop", base: m[1], key: m[2], value: stripTrailingSemicolon(m[3]) };

  return null;
}

function parseArrayMethodMutationLike(line: string, lang: string):
  | { kind: "push" | "pop"; base: string; arg?: string }
  | { kind: "append"; base: string; arg?: string }
  | null {
  const s = stripTrailingSemicolon(String(line || "").trim());
  if (!s) return null;

  // JS array: arr.push(x) / arr.pop()
  let m = s.match(/^([A-Za-z_$][\w$]*)\s*\.\s*(push|pop)\s*\((.*)\)\s*$/);
  if (m) {
    const base = m[1];
    const method = m[2];
    const arg = stripTrailingSemicolon(String(m[3] || "").trim());
    if (method === "push") return { kind: "push", base, arg };
    if (method === "pop") return { kind: "pop", base };
  }

  // Python list: arr.append(x) / arr.pop()
  if (String(lang || "").toLowerCase().includes("python")) {
    m = s.match(/^([A-Za-z_][\w_]*)\s*\.\s*(append|pop)\s*\((.*)\)\s*$/);
    if (m) {
      const base = m[1];
      const method = m[2];
      const arg = stripTrailingSemicolon(String(m[3] || "").trim());
      if (method === "append") return { kind: "append", base, arg };
      if (method === "pop") return { kind: "pop", base };
    }
  }

  return null;
}

function findUnusedVariables(code: string, lang: string) {
  const lines = String(code || "").split("\n");
  const assigned = new Set<string>();
  for (const line of lines) {
    const upd = parseAssignmentLike(line, lang);
    if (upd?.name) assigned.add(upd.name);
  }
  const src = String(code || "");
  const unused: string[] = [];
  for (const name of Array.from(assigned)) {
    try {
      const re = new RegExp(`\\b${name.replace(/[$]/g, "\\$")}\\b`, "g");
      const count = (src.match(re) || []).length;
      if (count <= 1) unused.push(name);
    } catch {
      // ignore regex errors
    }
  }
  return unused;
}

function getSuggestions(
  code: string,
  lang: string,
  activeLine: number,
  t: (key: string, fallback: string, options?: any) => string,
): string[] {
  const l = String(lang || "").toLowerCase();
  const src = String(code || "");
  const out: string[] = [];

  // Debug output
  if (
    /\bconsole\.(log|error|warn)\b/.test(src) ||
    /\bprint\s*\(/.test(src) ||
    /\bSystem\.out\.(println|print)\b/.test(src) ||
    /\bConsole\.(WriteLine|Write)\b/.test(src) ||
    /\bprintf\s*\(/.test(src)
  ) {
    out.push(t("sandbox.suggestion.removeDebug", "Remove debug output before sharing (e.g., console.log / print)."));
  }

  // JS: prefer ===
  if (l.includes("javascript")) {
    const hasLooseEq = /(^|[^=!<>])==([^=]|$)/m.test(src);
    if (hasLooseEq) {
      out.push(t("sandbox.suggestion.strictEq", "Prefer === over == in JavaScript."));
    }
    if (/\bvar\b/.test(src)) {
      out.push(t("sandbox.suggestion.avoidVar", "Prefer let/const over var."));
    }
  }

  // C/Java/C#: missing semicolon hint on current line
  if (l === "c" || l.includes("java") || l.includes("csharp")) {
    const line = String(src.split("\n")[Math.max(0, activeLine - 1)] || "").trim();
    if (
      line &&
      !/^(#|\/\/|\/\*|\*|using\b|import\b|from\b|class\b|struct\b)/.test(line) &&
      /[=)]\s*$/.test(line) &&
      !/[;{}]\s*$/.test(line)
    ) {
      out.push(t("sandbox.suggestion.semicolon", "This line looks like it might be missing a semicolon."));
    }
  }

  // Unused variables
  const unused = findUnusedVariables(src, lang).slice(0, 2);
  for (const name of unused) {
    out.push(t("sandbox.suggestion.unusedVar", "Variable \"{{name}}\" is assigned but never used.", { name }));
  }

  return out.slice(0, 3);
}

export default function SandboxPage() {
  const { progLang, t } = useLanguage();
  const lang = (progLang || "javascript") as string;
  const { toast } = useToast();

  const isJavaScript = guessIsJavaScript(lang);
  const isPython = String(lang || "").toLowerCase().includes("python");

  const [code, setCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`sandbox:code:${lang}`);
      if (saved) return saved;
    } catch {}
    return DEFAULT_CODE[lang] || DEFAULT_CODE.javascript;
  });

  // When switching programming language, load persisted code for that language.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sandbox:code:${lang}`);
      setCode(saved || DEFAULT_CODE[lang] || DEFAULT_CODE.javascript);
    } catch {
      setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.javascript);
    }
    // Reset execution state when switching languages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    reset();
    // Intentionally depends only on language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const [activeLine, setActiveLine] = useState<number>(1);
  const [snapshot, setSnapshot] = useState<{ stack: StackFrame[]; heap: HeapObject[]; vars?: Record<string, any> }>({
    stack: [],
    heap: [],
  });
  const [explanation, setExplanation] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);

  type OutputEntry = { id: string; stream: "stdout" | "stderr"; text: string; line?: number; ts: number };
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const outputEndRef = useRef<HTMLDivElement | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);

  const controllerRef = useRef<ReturnType<typeof createWorkerController> | null>(null);
  const playTimerRef = useRef<number | null>(null);

  const pythonTraceRef = useRef<{ trace: PythonTraceResult; idx: number; outCursor: number } | null>(null);

  const simFramesRef = useRef<SimFrame[]>([{ id: "global", name: "global", vars: {} }]);
  const simBraceDepthRef = useRef<number>(0);
  const simHeapRef = useRef<Record<string, HeapObject>>({});

  const lines = useMemo(() => String(code || "").split("\n"), [code]);
  const suggestions = useMemo(() => getSuggestions(code, lang, activeLine, t), [code, lang, activeLine, t]);

  useEffect(() => {
    try {
      outputEndRef.current?.scrollIntoView({ block: "end" });
    } catch {}
  }, [output.length]);

  const applyError = (e: any) => {
    const msg = (e && e.message) || String(e);
    setError(msg);
    const ln = typeof e?.line === "number" ? e.line : null;
    setErrorLine(ln);
    if (typeof ln === "number" && Number.isFinite(ln)) {
      setActiveLine(Math.max(1, ln));
      setNarrationFromLine(Math.max(1, ln));
    }
  };

  const persistCode = (next: string) => {
    setCode(next);
    try {
      localStorage.setItem(`sandbox:code:${lang}`, next);
    } catch {}
  };

  const stopPlaying = () => {
    if (playTimerRef.current) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  const reset = () => {
    stopPlaying();
    setError(null);
    setErrorLine(null);
    setOutput([]);
    setActiveLine(1);
    setSnapshot({ stack: [], heap: [] });
    setExplanation("");
    setIsExecuting(false);
    pythonTraceRef.current = null;
    simFramesRef.current = [{ id: "global", name: "global", vars: {} }];
    simBraceDepthRef.current = 0;
    simHeapRef.current = {};
    try {
      controllerRef.current?.terminate();
    } catch {}
    controllerRef.current = null;
  };

  const applySimulatedLine = (ln: number) => {
    const text = lines[Math.max(0, Math.min(lines.length - 1, ln - 1))] || "";
    const frames = simFramesRef.current;
    const lowerLang = String(lang || "").toLowerCase();

    // 0) Pop any temporary call frame scheduled for this line
    while (frames.length > 1) {
      const top = frames[frames.length - 1];
      if (top.temporary && typeof top.popAfterLine === "number" && ln >= top.popAfterLine) frames.pop();
      else break;
    }

    // 1) Pop frames if we left scope (Python indentation)
    if (lowerLang.includes("python")) {
      const indent = countLeadingIndent(text);
      if (!isBlankOrCommentLine(text, lang)) {
        while (frames.length > 1) {
          const top = frames[frames.length - 1];
          if (typeof top.indentLevel === "number" && indent <= top.indentLevel) frames.pop();
          else break;
        }
      }
    } else {
      // 2) C-like brace tracking for function frames
      const { open, close } = countBraces(text);
      const depthBefore = simBraceDepthRef.current;
      const depthAfter = Math.max(0, depthBefore + open - close);

      const fnName = extractFunctionNameCStyle(text);
      if (fnName && open > 0) {
        frames.push({
          id: `fn_${fnName}_${ln}`,
          name: `${fnName}()`,
          vars: {},
          exitBraceDepth: depthBefore,
        });
      }

      simBraceDepthRef.current = depthAfter;

      // Pop if braces closed back to exit depth
      while (frames.length > 1) {
        const top = frames[frames.length - 1];
        if (typeof top.exitBraceDepth === "number" && simBraceDepthRef.current <= top.exitBraceDepth) frames.pop();
        else break;
      }
    }

    const resolveVar = (name: string): Variable | null => {
      for (let i = frames.length - 1; i >= 0; i--) {
        const v = frames[i].vars[name];
        if (v) return v;
      }
      return null;
    };

    const resolveVarWithFrame = (name: string): { frame: SimFrame; v: Variable } | null => {
      for (let i = frames.length - 1; i >= 0; i--) {
        const v = frames[i].vars[name];
        if (v) return { frame: frames[i], v };
      }
      return null;
    };

    // 2.5) Show simple function calls as a temporary frame (one-step)
    const assignedCall = extractAssignedCallInfo(text, lang);
    const callInfo = assignedCall ? { name: assignedCall.name, args: assignedCall.args } : extractFunctionCallInfo(text, lang);
    if (callInfo) {
      const callVars: Record<string, Variable> = {};
      for (let i = 0; i < callInfo.args.length; i++) {
        const raw = callInfo.args[i];
        if (/^[A-Za-z_$][\w$]*$/.test(raw)) {
          const rhsVar = resolveVar(raw);
          if (rhsVar) callVars[`arg${i}`] = { ...rhsVar, name: `arg${i}`, changed: true };
          else callVars[`arg${i}`] = { name: `arg${i}`, value: raw, type: "primitive", changed: true };
        } else {
          const parsed = parseSimpleLiteral(raw);
          callVars[`arg${i}`] = { name: `arg${i}`, value: parsed.kind === "primitive" ? (parsed.primitive as any) : raw, type: "primitive", changed: true };
        }
      }
      frames.push({
        id: `call_${callInfo.name}_${ln}`,
        name: `${callInfo.name}()`,
        vars: callVars,
        temporary: true,
        popAfterLine: ln + 1,
      });
    }

    // clear changed flags in all frames
    for (const f of frames) {
      for (const k of Object.keys(f.vars)) {
        f.vars[k] = { ...f.vars[k], changed: false };
      }
    }

    // 3) Mutations first: arr[i]=, obj.prop=, obj["k"]=
    const mutation = parseMutationLike(text);
    if (mutation) {
      const baseVar = resolveVar(mutation.base);
      const top = frames[frames.length - 1] || frames[0];
      // Ensure base exists as a reference
      let refId = baseVar?.refId;
      if (!refId) {
        refId = `heap_${top.id}_${mutation.base}`;
        simHeapRef.current[refId] = {
          id: refId,
          className: mutation.kind === "index" ? "Array" : "Object",
          properties: [],
          highlight: true,
        };
        top.vars[mutation.base] = {
          name: mutation.base,
          value: `{ref:${refId}}`,
          type: "reference",
          refId,
          changed: true,
        };
      }

      const heapObj = simHeapRef.current[refId] || { id: refId, className: "Object", properties: [] };
      const parsed = parseSimpleLiteral(mutation.value);
      const newValue = parsed.kind === "primitive" ? String(parsed.primitive) : mutation.value;
      const key = mutation.key.replace(/^['"]|['"]$/g, "");

      const nextProps: Variable[] = (heapObj.properties || []).map((p) => ({ ...p, changed: false } as Variable));
      const idx = nextProps.findIndex((p) => p.name === key);
      const propVar: Variable = { name: key, value: newValue, type: "primitive", changed: true };
      if (idx >= 0) nextProps[idx] = propVar;
      else nextProps.push(propVar);

      simHeapRef.current[refId] = {
        ...heapObj,
        className: heapObj.className || (mutation.kind === "index" ? "Array" : "Object"),
        properties: nextProps,
        highlight: true,
      };
    }

    const methodMutation = parseArrayMethodMutationLike(text, lang);
    if (methodMutation) {
      const baseVar = resolveVar(methodMutation.base);
      const top = frames[frames.length - 1] || frames[0];
      let refId = baseVar?.refId;
      if (!refId) {
        refId = `heap_${top.id}_${methodMutation.base}`;
        simHeapRef.current[refId] = {
          id: refId,
          className: "Array",
          properties: [],
          highlight: true,
        };
        top.vars[methodMutation.base] = {
          name: methodMutation.base,
          value: `{ref:${refId}}`,
          type: "reference",
          refId,
          changed: true,
        };
      }

      const heapObj = simHeapRef.current[refId] || { id: refId, className: "Array", properties: [] };
      const nextProps: Variable[] = (heapObj.properties || []).map((p) => ({ ...(p as any), changed: false }));
      const numericKeys = nextProps
        .map((p) => Number(p.name))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);
      const lastIndex = numericKeys.length ? numericKeys[numericKeys.length - 1] : -1;

      if (methodMutation.kind === "push" || methodMutation.kind === "append") {
        const raw = String(methodMutation.arg || "").trim();
        const parsed = parseSimpleLiteral(raw);
        const newValue = parsed.kind === "primitive" ? String(parsed.primitive) : raw;
        nextProps.push({ name: String(lastIndex + 1), value: newValue, type: "primitive", changed: true });
      } else if (methodMutation.kind === "pop") {
        if (numericKeys.length) {
          const keyToRemove = String(lastIndex);
          const idx = nextProps.findIndex((p) => p.name === keyToRemove);
          if (idx >= 0) nextProps.splice(idx, 1);
        }
      }

      simHeapRef.current[refId] = {
        ...heapObj,
        className: heapObj.className || "Array",
        properties: nextProps,
        highlight: true,
      };
    }

    // 4) Plain assignment / declaration
    const upd = parseAssignmentLike(text, lang);
    if (upd) {
      const top = frames[frames.length - 1] || frames[0];
      const target = upd.declared ? top : (resolveVarWithFrame(upd.name)?.frame || top);
      const prevVar = upd.declared ? null : resolveVar(upd.name);

      // ++ / --
      if (upd.op === "++" || upd.op === "--") {
        const prevVal = prevVar?.value;
        const n = typeof prevVal === "number" ? prevVal : Number(prevVal);
        const next = Number.isFinite(n) ? (upd.op === "++" ? n + 1 : n - 1) : String(prevVal ?? "") + (upd.op === "++" ? "+1" : "-1");
        target.vars[upd.name] = { name: upd.name, value: next as any, type: "primitive", changed: true };
      } else if (upd.op && upd.op !== "=") {
        // +=, -=, etc. (best-effort for primitives)
        const parsedRhs = parseSimpleLiteral(upd.value);
        const rhsPrim = parsedRhs.kind === "primitive" ? parsedRhs.primitive : upd.value;
        const prevPrim = prevVar?.value;
        const aNum = typeof prevPrim === "number" ? prevPrim : Number(prevPrim);
        const bNum = typeof rhsPrim === "number" ? rhsPrim : Number(rhsPrim);
        let computed: any = `${String(prevPrim ?? "")} ${upd.op} ${String(rhsPrim)}`;

        if (upd.op === "+=") {
          if (Number.isFinite(aNum) && Number.isFinite(bNum)) computed = aNum + bNum;
          else computed = String(prevPrim ?? "") + String(rhsPrim ?? "");
        } else if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
          if (upd.op === "-=") computed = aNum - bNum;
          else if (upd.op === "*=") computed = aNum * bNum;
          else if (upd.op === "/=") computed = bNum === 0 ? "Infinity" : aNum / bNum;
          else if (upd.op === "%=") computed = aNum % bNum;
        }

        target.vars[upd.name] = { name: upd.name, value: computed, type: "primitive", changed: true };
      } else {
        // '=' assignment
        const rhsIdent = String(upd.value || "").trim();
        if (/^[A-Za-z_$][\w$]*$/.test(rhsIdent)) {
          const rhsVar = resolveVar(rhsIdent);
          if (rhsVar) {
            target.vars[upd.name] = { ...rhsVar, name: upd.name, changed: true };
          } else {
            target.vars[upd.name] = { name: upd.name, value: rhsIdent, type: "primitive", changed: true };
          }
        } else {
          const parsed = parseSimpleLiteral(upd.value);
          if (parsed.kind === "reference") {
            const refId = `heap_${target.id}_${upd.name}`;
            const props: Variable[] = (parsed.props || []).map((p) => ({
              name: p.name,
              value: p.value,
              type: "primitive",
              changed: true,
            }));
            simHeapRef.current[refId] = {
              id: refId,
              className: parsed.className || "Object",
              properties: props,
              highlight: true,
            };
            target.vars[upd.name] = {
              name: upd.name,
              value: `{ref:${refId}}`,
              type: "reference",
              refId,
              changed: true,
            };
          } else {
            target.vars[upd.name] = {
              name: upd.name,
              value: parsed.primitive as any,
              type: "primitive",
              changed: true,
            };
          }
        }
      }
    }

    // remove heap highlights if not touched
    Object.keys(simHeapRef.current).forEach((hid) => {
      simHeapRef.current[hid] = { ...simHeapRef.current[hid], highlight: false };
    });
    if (upd) {
      const top = frames[frames.length - 1] || frames[0];
      const hid = `heap_${top.id}_${upd.name}`;
      if (simHeapRef.current[hid]) simHeapRef.current[hid] = { ...simHeapRef.current[hid], highlight: true };
    }

    const stackFrames: StackFrame[] = frames.map((f, idx) => ({
      id: f.id,
      name: f.name,
      active: idx === frames.length - 1,
      variables: Object.values(f.vars).sort((a, b) => a.name.localeCompare(b.name)),
    }));

    // Flatten vars for debugging/suggestions (best-effort)
    const flatVars: Record<string, any> = {};
    for (const f of frames) {
      for (const v of Object.values(f.vars)) {
        flatVars[`${f.id}:${v.name}`] = v.value;
      }
    }

    setSnapshot({
      stack: stackFrames,
      heap: Object.values(simHeapRef.current),
      vars: flatVars,
    });
  };

  const setNarrationFromLine = (ln: number) => {
    const clamped = Math.max(1, Math.min(lines.length || 1, ln));
    const text = lines[Math.max(0, Math.min(lines.length - 1, clamped - 1))] || "";
    setExplanation(makeExplanationForLine(text, lang, t));
  };

  const advanceSimulatedStep = (delta: number = 1) => {
    const next = Math.max(1, Math.min(lines.length || 1, activeLine + delta));
    setActiveLine(next);
    setNarrationFromLine(next);
    applySimulatedLine(next);
    if (next >= (lines.length || 1)) {
      stopPlaying();
      setIsExecuting(false);
      try {
        toast({
          title: t("sandbox.doneTitle", "Execution finished"),
          description: t("sandbox.doneDesc", "Reached the end of your program."),
          variant: "default",
        });
      } catch {}
    }
  };

  const ensureController = async () => {
    if (controllerRef.current) return controllerRef.current;

    setError(null);
    setErrorLine(null);
    setIsExecuting(true);

    const syntaxIssue = basicSyntaxCheck(code, lang);
    if (syntaxIssue) {
      setIsExecuting(false);
      throw new Error(t("sandbox.syntaxErrorDesc", `Fix the code first: ${syntaxIssue}`, { details: syntaxIssue }));
    }

    // Non-JS: no worker controller; we simulate stepping in the UI.
    if (!isJavaScript) {
      setIsExecuting(false);
      return null;
    }

    // Execute as a script: the worker will run the top-level code, and we call a no-op function after.
    const functionName = "__cf_script";

    const controller = createWorkerController(code, functionName, [], {
      onStep: (line) => {
        const ln = Number(line) || 1;
        setActiveLine(ln);
        const text = lines[Math.max(0, Math.min(lines.length - 1, ln - 1))] || "";
        setExplanation(makeExplanationForLine(text, lang, t));
      },
      onStdout: (entry) => {
        try {
          const id = `${Date.now()}-${Math.random()}`;
          setOutput((prev) => {
            const next = [...prev, { id, stream: entry.stream, text: entry.text, line: entry.line, ts: Date.now() }];
            return next.length > 300 ? next.slice(next.length - 300) : next;
          });
        } catch {}
      },
      onSnapshot: (s) => {
        try {
          let normStack: any[] = [];
          if (s && Array.isArray((s as any).stack)) {
            normStack = (s as any).stack.map((f: any) => {
              const vars = f && Array.isArray(f.variables) ? f.variables : [];
              return { id: f.id || String(Math.random()), name: f.name || "frame", active: true, variables: vars };
            });
          }
          const normHeap = (s && Array.isArray((s as any).heap)) ? (s as any).heap : [];
          setSnapshot({ stack: normStack, heap: normHeap, vars: (s as any)?.vars || {} });
        } catch {}
      },
    });

    controllerRef.current = controller;

    controller.result
      .then(() => {
        stopPlaying();
        setIsExecuting(false);
        try {
          toast({ title: t("sandbox.doneTitle", "Execution finished"), description: t("sandbox.doneDesc", "Reached the end of your program."), variant: "default" });
        } catch {}
      })
      .catch((e) => {
        stopPlaying();
        setIsExecuting(false);
        const msg = (e && (e as any).message) || String(e);
        applyError(e);
        try {
          toast({ title: t("sandbox.errorTitle", "Execution error"), description: msg, variant: "destructive" });
        } catch {}
      });

    // Avoid stepping too early
    try {
      await controller.ready;
    } catch {}

    return controller;
  };

  const ensurePythonTrace = async () => {
    if (pythonTraceRef.current) return pythonTraceRef.current;

    setError(null);
    setErrorLine(null);

    const syntaxIssue = basicSyntaxCheck(code, lang);
    if (syntaxIssue) {
      throw new Error(t("sandbox.syntaxErrorDesc", `Fix the code first: ${syntaxIssue}`, { details: syntaxIssue }));
    }

    const trace = await runPythonTrace(code, { maxEvents: 2000 });
    const state = { trace, idx: -1, outCursor: 0 };
    pythonTraceRef.current = state;
    return state;
  };

  const advancePythonTraceStep = (delta: number = 1) => {
    const st = pythonTraceRef.current;
    if (!st) return;
    const events = st.trace.events || [];
    const nextIdx = Math.max(-1, Math.min(events.length - 1, st.idx + delta));
    if (events.length === 0) {
      // No events; treat as finished.
      stopPlaying();
      setIsExecuting(false);
      if (st.trace.ok) {
        try {
          toast({ title: t("sandbox.doneTitle", "Execution finished"), description: t("sandbox.doneDesc", "Reached the end of your program."), variant: "default" });
        } catch {}
      } else {
        const err: any = new Error(st.trace.error || "Python execution error");
        if (typeof st.trace.line === "number") err.line = st.trace.line;
        applyError(err);
        try {
          toast({ title: t("sandbox.errorTitle", "Execution error"), description: err.message, variant: "destructive" });
        } catch {}
      }
      return;
    }

    st.idx = nextIdx;
    const ev: any = events[nextIdx];
    const ln = Number(ev?.line) || 1;
    setActiveLine(ln);
    setNarrationFromLine(ln);

    // Build stack
    const stackFrames: StackFrame[] = Array.isArray(ev?.stack)
      ? ev.stack.map((fr: any, i: number) => {
          const locals = Array.isArray(fr?.locals) ? fr.locals : [];
          const variables: Variable[] = locals
            .map((v: any) => {
              const name = String(v?.name || "");
              const refId = typeof v?.refId === "string" ? v.refId : undefined;
              const repr = String(v?.repr ?? "");
              return {
                name,
                value: refId ? `{ref:${refId}}` : repr,
                type: refId ? "reference" : "primitive",
                refId,
                changed: true,
              } as Variable;
            })
            .filter((v: Variable) => !!v.name)
            .sort((a: Variable, b: Variable) => a.name.localeCompare(b.name));
          return {
            id: `py_${nextIdx}_${i}`,
            name: `${String(fr?.name || "?")}()` ,
            active: i === 0,
            variables,
          } as StackFrame;
        })
      : [];

    // Build heap
    const heap: HeapObject[] = Array.isArray(ev?.heap)
      ? ev.heap.map((o: any) => {
          const props = Array.isArray(o?.properties) ? o.properties : [];
          return {
            id: String(o?.id || "py_heap"),
            className: String(o?.className || "Object"),
            properties: props
              .map((p: any) => ({
                name: String(p?.name || ""),
                value: String(p?.value ?? ""),
                type: p?.type === "reference" ? "reference" : "primitive",
                changed: false,
              }))
              .filter((p: any) => !!p.name),
            highlight: false,
          } as HeapObject;
        })
      : [];

    setSnapshot({ stack: stackFrames, heap });

    // Reveal python output up to this event index
    const out = Array.isArray(st.trace.output) ? st.trace.output : [];
    while (st.outCursor < out.length) {
      const entry: any = out[st.outCursor];
      const eventIndex = Number(entry?.eventIndex);
      if (Number.isFinite(eventIndex) && eventIndex > nextIdx + 1) break;
      const id = `${Date.now()}-${Math.random()}`;
      const stream: "stdout" | "stderr" = entry?.stream === "stderr" ? "stderr" : "stdout";
      const text = String(entry?.text ?? "");
      const line = typeof entry?.line === "number" ? entry.line : undefined;
      setOutput((prev) => {
        const next = [...prev, { id, stream, text, line, ts: Date.now() }];
        return next.length > 300 ? next.slice(next.length - 300) : next;
      });
      st.outCursor++;
    }

    // Finished?
    if (nextIdx >= events.length - 1) {
      stopPlaying();
      setIsExecuting(false);
      if (st.trace.ok) {
        try {
          toast({ title: t("sandbox.doneTitle", "Execution finished"), description: t("sandbox.doneDesc", "Reached the end of your program."), variant: "default" });
        } catch {}
      } else {
        const err: any = new Error(st.trace.error || "Python execution error");
        if (typeof st.trace.line === "number") err.line = st.trace.line;
        applyError(err);
        try {
          toast({ title: t("sandbox.errorTitle", "Execution error"), description: err.message, variant: "destructive" });
        } catch {}
      }
    }
  };

  const stepOnce = async () => {
    stopPlaying();
    if (!isJavaScript) {
      setErrorLine(null);
      if (isPython) {
        try {
          setIsExecuting(true);
          await ensurePythonTrace();
          advancePythonTraceStep(1);
        } catch (e: any) {
          setIsExecuting(false);
          applyError(e);
          try {
            toast({ title: t("sandbox.syntaxErrorTitle", "Syntax issue"), description: (e && e.message) || String(e), variant: "destructive" });
          } catch {}
        }
        return;
      } else {
        const syntaxIssue = basicSyntaxCheck(code, lang);
        if (syntaxIssue) {
          const msg = t("sandbox.syntaxErrorDesc", `Fix the code first: ${syntaxIssue}`, { details: syntaxIssue });
          setError(msg);
          try {
            toast({ title: t("sandbox.syntaxErrorTitle", "Syntax issue"), description: msg, variant: "destructive" });
          } catch {}
          return;
        }
        setIsExecuting(true);
        advanceSimulatedStep(1);
        return;
      }
    }
    try {
      const controller = await ensureController();
      controller?.step();
    } catch (e: any) {
      applyError(e);
    }
  };

  const play = async () => {
    if (isPlaying) return;
    if (!isJavaScript) {
      setErrorLine(null);
      if (isPython) {
        try {
          setError(null);
          setIsExecuting(true);
          await ensurePythonTrace();
        } catch (e: any) {
          setIsExecuting(false);
          applyError(e);
          return;
        }

        setIsPlaying(true);
        const stepDelay = Math.max(60, speed);
        playTimerRef.current = window.setInterval(() => {
          advancePythonTraceStep(1);
        }, stepDelay);
        return;
      } else {
        const syntaxIssue = basicSyntaxCheck(code, lang);
        if (syntaxIssue) {
          const msg = t("sandbox.syntaxErrorDesc", `Fix the code first: ${syntaxIssue}`, { details: syntaxIssue });
          setError(msg);
          try {
            toast({ title: t("sandbox.syntaxErrorTitle", "Syntax issue"), description: msg, variant: "destructive" });
          } catch {}
          return;
        }
        setError(null);
        setIsExecuting(true);
        setIsPlaying(true);
        const stepDelay = Math.max(60, speed);
        playTimerRef.current = window.setInterval(() => {
          advanceSimulatedStep(1);
        }, stepDelay);
        return;
      }
    }

    try {
      await ensureController();
    } catch (e: any) {
      applyError(e);
      return;
    }

    setIsPlaying(true);
    const stepDelay = Math.max(60, speed);
    playTimerRef.current = window.setInterval(() => {
      try {
        controllerRef.current?.step();
      } catch {}
    }, stepDelay);
  };

  const pause = () => {
    stopPlaying();
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div>
            <div className="text-lg font-semibold">{t("sandbox.title", "Sandbox")}</div>
            <div className="text-xs text-muted-foreground">
              {t(
                "sandbox.subtitle",
                "Paste your full code and see how it runs line by line."
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("sandbox.reset", "Reset")}
            </Button>
            {!isPlaying ? (
              <Button onClick={play} disabled={isExecuting && !controllerRef.current}>
                <Play className="w-4 h-4 mr-2" />
                {t("sandbox.play", "Play")}
              </Button>
            ) : (
              <Button variant="secondary" onClick={pause}>
                <Pause className="w-4 h-4 mr-2" />
                {t("sandbox.pause", "Pause")}
              </Button>
            )}
            <Button variant="outline" onClick={stepOnce}>
              <SkipForward className="w-4 h-4 mr-2" />
              {t("sandbox.step", "Step")}
            </Button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">{t("sandbox.speed", "Speed")}</div>
            <div className="w-56">
              <Slider value={[speed]} min={100} max={2000} step={50} onValueChange={(v) => setSpeed(v[0] ?? 1200)} />
            </div>
            <div className="text-xs text-muted-foreground">{Math.round(speed)}ms</div>
          </div>
          {!guessIsJavaScript(lang) && !isPython && (
            <div className="mt-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
              {t(
                "sandbox.nonJsNote",
                "JavaScript is fully supported for real execution now. For other languages we will add an engine (static checks + step simulation) next."
              )}
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={55} minSize={35}>
              <div className="h-full p-4">
                <CodeEditor code={code} activeLine={activeLine} editable onChange={persistCode} errorLine={errorLine} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={25}>
              <div className="h-full p-4 flex flex-col gap-4 overflow-auto">
                <Card className="p-4 bg-card/50 border-white/10">
                  <div className="text-sm font-semibold mb-2">{t("sandbox.narration", "Narration")}</div>
                  <div className="text-sm text-muted-foreground">{explanation || t("sandbox.narrationEmpty", "Press Step or Play to start.")}</div>

                  {suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="text-xs font-semibold mb-2">{t("sandbox.suggestionsLabel", "Suggestions")}</div>
                      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        {suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>

                <Card className="p-4 bg-card/50 border-white/10">
                  <div className="text-sm font-semibold mb-2">{t("sandbox.output", "Output")}</div>
                  {!isJavaScript && !isPython && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {t("sandbox.outputNonJsNote", "Output is shown for JavaScript execution. Other languages are simulated for now.")}
                    </div>
                  )}
                  <div className="h-40 overflow-auto rounded border border-white/10 bg-background/30 p-2">
                    {output.length === 0 ? (
                      <div className="text-xs text-muted-foreground">{t("sandbox.outputEmpty", "No output yet.")}</div>
                    ) : (
                      <div className="space-y-1">
                        {output.map((o) => (
                          <div
                            key={o.id}
                            className={
                              "font-mono text-xs whitespace-pre-wrap break-words " +
                              (o.stream === "stderr" ? "text-red-200" : "text-muted-foreground")
                            }
                          >
                            {typeof o.line === "number" ? `L${o.line}: ` : ""}
                            {o.text}
                          </div>
                        ))}
                        <div ref={outputEndRef} />
                      </div>
                    )}
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  <CallStack stack={snapshot.stack || []} />
                  <HeapMemory heap={snapshot.heap || []} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </Layout>
  );
}
