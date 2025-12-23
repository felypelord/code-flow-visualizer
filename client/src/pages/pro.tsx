import React, { lazy, Suspense, useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3,
  Crown,
  Database,
  PauseCircle,
  Code2,
  Sparkles,
  Search,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProExercisesGrid } from "@/components/pro-exercises-grid";
import { getAllProExercises } from "@/lib/pro-exercises";


const ProDebuggerLazy = lazy(() =>
  import("@/components/visualizer/pro-debugger").then((m) => ({ default: m.ProDebugger }))
);

const AICodeInspectorLazy = lazy(() =>
  import("@/components/visualizer/ai-code-inspector").then((m) => ({ default: m.AICodeInspector }))
);

const VIPPlaygroundLazy = lazy(() =>
  import("@/components/visualizer/vip-playground").then((m) => ({ default: m.VIPPlayground }))
);

const ProAdvancedFeaturesLazy = lazy(() =>
  import("@/components/pro-advanced-features").then((m: any) => ({ default: m.ProAdvancedFeatures || m.default }))
);

export default function ProPage() {
  const { user, refreshUser } = useUser();
  const t: any = {};

  const [, setLocation] = useLocation();
  const [profilerCode, setProfilerCode] = useState(
    "function fib(n){ return n<=1 ? n : fib(n-1)+fib(n-2); }\nfunction main(){ return fib(15); }"
  );
  const profilerExamples = [
    { id: "fib", code: "function fib(n){ return n<=1 ? n : fib(n-1)+fib(n-2); }\nfunction main(){ return fib(12); }" },
    { id: "loop", code: "function main(){ let s=0; for(let i=0;i<5_000;i++){ s+=i; } return s; }" },
    { id: "async", code: "async function work(){ return 42; }\nfunction main(){ return work(); }" },
    { id: "sort", code: "function main(){ const arr=[5,1,9,2]; return arr.sort((a,b)=>a-b); }" },
  ];
  const profilerExampleLabels: Record<string, string> = {
    fib: "Profiler Example Fib",
    loop: "Profiler Example Loop",
    async: "Profiler Example Async",
    sort: "Profiler Example Sort",
  };
  const [profilerRuns, setProfilerRuns] = useState<Array<{ run: number; ms: number; result?: any }>>([]);
  const [profilerError, setProfilerError] = useState<string | null>(null);
  const [profilerConfig, setProfilerConfig] = useState<{ runs: number; warmup: number; captureConsole: boolean }>({ runs: 5, warmup: 1, captureConsole: true });
  const [profilerTimeline, setProfilerTimeline] = useState<{
    runs: Array<{ run: number; ms: number; result?: any }>;
    events: Array<{ run: number; t: number; type: "log" | "start" | "end" | "result" | "error"; data?: any }>;
  } | null>(null);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [profilerExecutionLine, setProfilerExecutionLine] = useState<number | null>(null);
  const [profilerShowRealtime, setProfilerShowRealtime] = useState(true);
  const [category, setCategory] = useState<"all" | "algorithms" | "data-structures" | "async" | "performance" | "design-patterns">("all");
  const [sort, setSort] = useState<"relevance" | "difficulty" | "time">("relevance");
  const [difficulty, setDifficulty] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [query, setQuery] = useState("");

  const [breakpoints, setBreakpoints] = useState<Array<{ id: string; line: number; condition?: string; active: boolean }>>([
    { id: "bp-1", line: 12, condition: "i === 5", active: true },
    { id: "bp-2", line: 24, condition: "value > 100", active: false },
  ]);

  const [inspectorInput, setInspectorInput] = useState(
    '{\n  "user": {"name": "Alex", "level": 7},\n  "array": [1,2,3],\n  "flags": {"pro": true, "beta": false}\n}'
  );
  const inspectorExamples = [
    {
      id: "user",
      value: '{\n  "user": {"name": "Alex", "level": 7},\n  "flags": {"pro": true, "beta": false}\n}',
    },
    {
      id: "nested",
      value: '{"company":{"name":"TechCorp","address":{"street":"Market Street, 100","city":"NY","country":"USA"},"employees":150,"active":true}}',
    },
    {
      id: "array",
      value: '{"products":[{"id":1,"name":"Laptop","price":1299.99,"tags":["tech","computer"],"stock":5},{"id":2,"name":"Mouse","price":49.9,"tags":["tech","peripheral"],"stock":50}]}'
    },
    {
      id: "closure",
      value: '{"counter":{"value":0,"increment":"function() { this.value++; }","getValue":"function() { return this.value; }"},"type":"closure"}',
    },
    {
      id: "prototype",
      value: '{"person":{"name":"John","__proto__":{"species":"human","breathe":"function(){}","__proto__":{"toString":"function(){}"}}},"info":"prototype chain"}',
    },
    {
      id: "async",
      value: '{"promise":{"state":"pending","value":null},"async":"async function fetchData() { return await fetch(...); }","status":"shows async states"}',
    },
    {
      id: "circular",
      value: '{"node":{"id":1,"next":"<ref:node>","data":"A"},"warning":"JSON.stringify fails here"}',
    },
    {
      id: "mixed",
      value: '{"data":[42,"text",true,null,{"nested":true},[1,2,3],undefined],"types":"number,string,boolean,null,object,array,undefined"}',
    },
    {
      id: "symbols",
      value: '{"key":"Symbol(id)","weakMap":"WeakMap {{obj1 => 1}}","use":"private properties and metadata"}',
    },
    {
      id: "graph",
      value: '{"graph":{"nodes":[{"id":"A","label":"Start"},{"id":"B","label":"Middle"},{"id":"C","label":"End"}],"edges":[{"from":"A","to":"B","weight":5},{"from":"B","to":"C","weight":3}]}}',
    },
  ];
  const inspectorLabels: Record<string, string> = {
    user: 'User',
    nested: 'Nested',
    array: 'Array',
    closure: 'Closure',
    prototype: 'Prototype',
    async: 'Async',
    circular: 'Circular',
    mixed: 'Mixed',
    symbols: 'Symbols',
    graph: 'Graph',
  };
  const inspectorDescriptions: Record<string, string> = {
    user: "Inspect user-related objects and properties.",
    nested: "Explore deeply nested object structures and their relationships.",
    array: "View arrays, indices, and common array operations.",
    closure: "Inspect closures and captured lexical scope values.",
    prototype: "Examine prototype chains and inherited properties.",
    async: "Analyze async functions, promises, and timing behavior.",
    circular: "Detect and visualize circular references in objects.",
    mixed: "Inspect mixed-type collections and heterogeneous structures.",
    symbols: "Reveal symbol-keyed properties and metadata.",
    graph: "Render object graphs for complex data visualizations.",
  };
  const [inspectorParsed, setInspectorParsed] = useState<any>(null);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [inspectorQuery, setInspectorQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedInspectorExampleId, setSelectedInspectorExampleId] = useState<string | null>(null);
  const [scratchpad, setScratchpad] = useState(
    "// VIP Playground\n// Sketch ideas or quick pseudo-code here.\nfunction snippet() {\n  return ['stack', 'heap', 'tests'];\n}"
  );
  const [trialUses, setTrialUses] = useState<Record<string, number>>({});

  const handleGoToPricing = () => setLocation("/pricing?vip=1");

  const logEvent = (name: string, payload?: Record<string, any>) => {
    try {
      console.info("[pro-analytics]", name, payload || {});
    } catch (_) {}
  };

  const allowProAction = (feature: string) => {
    if (user?.isPro) return true;
    const used = trialUses[feature] || 0;
    if (used === 0) {
      setTrialUses((prev) => ({ ...prev, [feature]: used + 1 }));
      toast({ title: "First use unlocked", description: "Subscribe to Pro for unlimited use." });
      return true;
    }
    toast({ title: "Pro exclusive feature", description: "Subscribe to continue using this feature." });
    return false;
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const copyScratchpad = async () => {
    if (!allowProAction("scratchpad-copy")) return;
    try {
      await navigator.clipboard.writeText(scratchpad);
      toast({ title: "Copied!", description: "Pro Playground code copied to clipboard." });
    } catch (err) {
      toast({ title: "Copy failed", description: String(err) });
    }
  };

  const clearScratchpad = () => {
    if (!allowProAction("scratchpad-clear")) return;
    setScratchpad("");
  };

  const runProfiler = () => {
    if (!allowProAction("profiler-run")) return;
    try {
      const instrumentSource = (code: string) => {
        return code
          .split("\n")
          .map((line, idx) => `markLine(${idx + 1}); ${line}`)
          .join("\n");
      };

      const source = profilerShowRealtime ? instrumentSource(profilerCode) : profilerCode;
      const fn = new Function(
        "performance",
        "markLine",
        `${source}; return typeof main === 'function' ? main() : undefined;`
      );

      // Optional warmup
      for (let w = 0; w < Math.max(0, profilerConfig.warmup); w++) {
        try {
          fn(performance);
        } catch {
          // ignore warmup errors
        }
      }

      const runs: Array<{ run: number; ms: number; result?: any }> = [];
      const events: Array<{ run: number; t: number; type: "log" | "start" | "end" | "result" | "error"; data?: any }> = [];
      const originalLog = console.log;

      for (let i = 0; i < Math.max(1, profilerConfig.runs); i++) {
        const runIndex = i + 1;
        const start = performance.now();
        events.push({ run: runIndex, t: 0, type: "start" });
        if (profilerConfig.captureConsole) {
          console.log = (...args: any[]) => {
            const now = performance.now();
            events.push({ run: runIndex, t: Number((now - start).toFixed(3)), type: "log", data: args });
            // mirror to console
            try { originalLog.apply(console, args); } catch {}
          };
        }
        try {
          setProfilerExecutionLine(null);
          const result = fn(performance, (line: number) => {
            try { setProfilerExecutionLine(line); } catch {}
          });
          const end = performance.now();
          const ms = Number((end - start).toFixed(3));
          events.push({ run: runIndex, t: ms, type: "result", data: result });
          events.push({ run: runIndex, t: ms, type: "end" });
          runs.push({ run: runIndex, ms, result });
        } catch (err: any) {
          const end = performance.now();
          const ms = Number((end - start).toFixed(3));
          events.push({ run: runIndex, t: ms, type: "error", data: err?.message || String(err) });
          runs.push({ run: runIndex, ms });
          throw err;
        } finally {
          setProfilerExecutionLine(null);
          console.log = originalLog;
        }
      }
      setProfilerRuns(runs);
      setProfilerTimeline({ runs, events });
      setTimelineIndex(0);
      setTimelinePlaying(true);
      setProfilerError(null);
    } catch (e: any) {
      setProfilerError(e?.message || "Profiler Error");
      setProfilerRuns([]);
      setProfilerTimeline(null);
      setTimelinePlaying(false);
      setTimelineIndex(0);
    }
  };

  const toggleBreakpoint = (id: string) => {
    setBreakpoints((prev) => prev.map((bp) => (bp.id === id ? { ...bp, active: !bp.active } : bp)));
  };

  const addBreakpoint = () => {
    if (!allowProAction("breakpoint-add")) return;
    const nextId = `bp-${breakpoints.length + 1}`;
    setBreakpoints((prev) => [...prev, { id: nextId, line: 1, condition: "", active: true }]);
  };

  const getValueAtPath = (obj: any, pathStr: string | null) => {
    if (!obj || !pathStr) return null;
    const segments = pathStr.split(".").filter(Boolean);
    let current: any = obj;
    for (const seg of segments) {
      if (seg.startsWith("[")) {
        const idx = Number(seg.replace(/[^0-9]/g, ""));
        current = Array.isArray(current) ? current[idx] : undefined;
      } else {
        current = current?.[seg];
      }
      if (current === undefined || current === null) break;
    }
    return current;
  };

  const parseInspector = () => {
    if (!allowProAction("inspector-parse")) return;
    try {
      const parsed = JSON.parse(inspectorInput);
      setInspectorParsed(parsed);
      setInspectorError(null);
    } catch (e: any) {
      setInspectorError(e?.message || "Pro Inspector Invalid Json");
      setInspectorParsed(null);
    }
  };

  const renderObject = (value: any, depth = 0, path: string[] = []) => {
    if (value === null) return <span className="text-amber-300">null</span>;
    if (typeof value === "boolean") return <span className="text-amber-300">{String(value)}</span>;
    if (typeof value === "number") return <span className="text-amber-300">{value}</span>;
    if (typeof value === "string") return <span className="text-emerald-200">"{value}"</span>;
    if (Array.isArray(value)) {
      return (
        <div className="pl-4 space-y-1">
          {value.map((v, idx) => {
            const childPath = [...path, `[${idx}]`];
            const match = inspectorQuery && (String(idx).includes(inspectorQuery) || JSON.stringify(v).includes(inspectorQuery));
            return (
              <div
                key={`${depth}-arr-${idx}`}
                className={`text-gray-200 text-sm relative pl-2 ${match ? "bg-amber-500/10" : ""}`}
                onClick={() => setSelectedPath(childPath.join("."))}
              >
                <span className="text-gray-400">[{idx}]</span> {renderObject(v, depth + 1, childPath)}
              </div>
            );
          })}
        </div>
      );
    }
    if (typeof value === "object") {
      return (
        <div className="pl-4 space-y-1">
          {Object.entries(value).map(([k, v]) => {
            const childPath = [...path, k];
            const match = inspectorQuery && (k.includes(inspectorQuery) || JSON.stringify(v).includes(inspectorQuery));
            return (
              <div
                key={`${depth}-${k}`}
                className={`text-gray-200 text-sm relative pl-2 ${match ? "bg-emerald-500/10" : ""}`}
                onClick={() => setSelectedPath(childPath.join("."))}
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-amber-300" />
                  <span className="text-amber-300">{k}</span>
                </span>
                : {renderObject(v, depth + 1, childPath)}
              </div>
            );
          })}
        </div>
      );
    }
    return <span className="text-gray-300">{String(value)}</span>;
  };

  const renderCodePreview = () => {
    const formatted = inspectorParsed ? JSON.stringify(inspectorParsed, null, 2) : inspectorInput;
    const lines = formatted.split("\n");
    const pathSegments = selectedPath ? selectedPath.replace(/\[|\]/g, "").split(".").filter(Boolean) : [];
    return (
      <div className="bg-slate-950/60 border border-amber-400/15 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-[11px] text-amber-100 border-b border-amber-400/20 bg-amber-500/10 flex items-center justify-between">
          <span>Code Map</span>
          {selectedPath && (
            <span className="font-mono text-amber-300">
              Inspector Current Path Label: {selectedPath}
            </span>
          )}
        </div>
        <div className="max-h-64 overflow-auto font-mono text-xs text-amber-50/90">
          {lines.map((line, idx) => {
            const matchesQuery = inspectorQuery && line.toLowerCase().includes(inspectorQuery.toLowerCase());
            const matchesPath = pathSegments.some((seg) => seg && line.includes(seg));
            const isHighlight = Boolean(matchesQuery || matchesPath);
            return (
              <div
                key={`code-line-${idx}`}
                className={`flex items-start gap-2 px-3 py-0.5 ${isHighlight ? "bg-amber-500/25 text-amber-50 border-l-2 border-amber-300 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]" : "border-l-2 border-transparent text-slate-200"}`}
              >
                <span className="w-10 text-right text-[10px] text-amber-400/70 select-none">{idx + 1}</span>
                <span className="whitespace-pre">{line || " "}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedValue = inspectorParsed && selectedPath ? getValueAtPath(inspectorParsed, selectedPath) : null;
  const selectedValuePreview =
    selectedValue !== null && selectedValue !== undefined ? JSON.stringify(selectedValue, null, 2) : null;
  const valueKind = selectedValue === null
    ? "null"
    : selectedValue === undefined
      ? "undefined"
      : Array.isArray(selectedValue)
        ? "array"
        : typeof selectedValue;
  const objectKeysCount =
    selectedValue && typeof selectedValue === "object" && !Array.isArray(selectedValue) ? Object.keys(selectedValue).length : null;
  const arrayLength = Array.isArray(selectedValue) ? selectedValue.length : null;

  const renderTimeline = () => {
    if (!profilerTimeline) return null;
    const maxMs = Math.max(...profilerTimeline.runs.map((r) => r.ms), 1);
    const currentEvent = profilerTimeline.events[timelineIndex] || null;
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-300 flex-1">Execution timeline</div>
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Button size="sm" variant="outline" className="border-amber-400/40 text-amber-100" onClick={() => setTimelinePlaying((p) => !p)} disabled={!profilerTimeline?.events.length}>
              {timelinePlaying ? "Pause" || "Pause" : "Play" || "Play"}
            </Button>
            <input
              type="range"
              min={0}
              max={Math.max(0, (profilerTimeline?.events.length || 1) - 1)}
              value={timelineIndex}
              onChange={(e) => setTimelineIndex(Number(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
        <div className="space-y-2">
          {profilerTimeline.runs.map((r) => (
            <div key={`run-${r.run}`} className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Run {r.run}</span>
              <div className="flex-1 h-3 bg-black/30 rounded">
                <div
                  className="h-3 bg-amber-500 rounded"
                  style={{ width: `${Math.min(100, (r.ms / maxMs) * 100)}%` }}
                  title={`${r.ms}ms`}
                />
              </div>
              <span className="text-xs text-amber-300 font-mono">{r.ms} ms</span>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-black/20 border border-amber-400/20 rounded p-2 max-h-40 overflow-y-auto">
          {profilerTimeline.events.map((e, idx) => (
            <div key={`evt-${idx}`} className={`text-xs ${idx === timelineIndex ? "text-amber-200 font-semibold" : "text-gray-200"}`}>
              <span className={idx === timelineIndex ? "text-amber-400" : "text-gray-400"}>[{e.t}ms]</span> <span className="text-amber-300">Run {e.run}</span> → {e.type}
              {e.data !== undefined && <span className="text-gray-300">: {typeof e.data === "string" ? e.data : JSON.stringify(e.data)}</span>}
            </div>
          ))}
          {currentEvent && (
            <div className="mt-2 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded p-2">
              <div className="font-semibold">Current Event</div>
              <div>Run {currentEvent.run} • {currentEvent.type} • {currentEvent.t}ms</div>
              {currentEvent.data !== undefined && (
                <div className="text-amber-100/80">Profiler Current Event Data: {typeof currentEvent.data === "string" ? currentEvent.data : JSON.stringify(currentEvent.data)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const applyInspectorExample = (id: string) => {
    if (!allowProAction("inspector-example")) return;
    const ex = inspectorExamples.find((e) => e.id === id);
    if (ex) {
      setInspectorInput(ex.value);
      setSelectedInspectorExampleId(ex.id);
      setSelectedPath(null);
      setInspectorParsed(null);
      setInspectorError(null);
    }
  };

  const applyProfilerExample = (id: string) => {
    if (!allowProAction("profiler-example")) return;
    const ex = profilerExamples.find((e) => e.id === id);
    if (ex) {
      setProfilerCode(ex.code);
      setProfilerRuns([]);
      setProfilerTimeline(null);
      setTimelineIndex(0);
      setTimelinePlaying(false);
      setProfilerError(null);
    }
  };

  // Finalize VIP signup after returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    const pendingRaw = sessionStorage.getItem("pendingSignup");
    if (!pendingRaw) return;

    (async () => {
      try {
        const cres = await fetch("/api/pro/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const cdata = await cres.json();
        if (!cres.ok || !cdata?.ok || !cdata?.proToken) {
          throw new Error(cdata?.error || "Pro VIP Payment Not Confirmed");
        }
        const proToken: string = cdata.proToken;

        const pending = JSON.parse(pendingRaw);
        const payload = {
          ...pending,
          proToken,
          // Ensure datetime format
          dateOfBirth: pending.dateOfBirth && pending.dateOfBirth.length <= 10
            ? new Date(pending.dateOfBirth + "T00:00:00.000Z").toISOString()
            : pending.dateOfBirth,
        };

        const sres = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const sdata = await sres.json();
        if (!sres.ok || !sdata?.ok) {
          throw new Error(sdata?.message || sdata?.error || "Pro VIP Create Failed");
        }
        sessionStorage.removeItem("pendingSignup");
        // Auto-login
        try {
          const lres = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pending.email, password: pending.password }),
          });
          const ldata = await lres.json();
          if (lres.ok && ldata?.token) {
            localStorage.setItem("token", ldata.token);
            toast({ title: "VIP Created", description: "Login to access your VIP features." });
            window.location.reload();
            return;
          }
        } catch {}
        toast({ title: "VIP Created", description: "Check your email for confirmation." });
        await refreshUser();
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || String(err) });
      }
    })();
  }, [refreshUser, t]);

  useEffect(() => {
    if (!timelinePlaying || !profilerTimeline?.events?.length) return;
    const total = profilerTimeline.events.length;
    const id = setInterval(() => {
      setTimelineIndex((idx) => {
        const next = idx + 1;
        if (next >= total) {
          setTimelinePlaying(false);
          return Math.max(0, total - 1);
        }
        return next;
      });
    }, 800);
    return () => clearInterval(id);
  }, [timelinePlaying, profilerTimeline]);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-950 py-12">
        {/* Header (Learning-only) */}
        <div className="max-w-5xl mx-auto px-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl shadow-amber-500/20">
            <div className="space-y-3 text-center text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-300/40 text-amber-200 text-xs font-semibold">
                <Crown className="w-4 h-4" /> VIP
              </div>
              <h1 className="text-3xl font-bold">
                <span className="relative inline-block">
                  <Crown className="absolute -top-8 left-1 -rotate-12 w-10 h-10 text-amber-300 drop-shadow-[0_0_12px_rgba(255,215,0,0.45)]" />
                  <span className="block px-3 py-1 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 text-transparent bg-clip-text drop-shadow-[0_0_18px_rgba(255,214,102,0.35)]">
                    Pro Learning
                  </span>
                </span>
              </h1>
              <p className="text-sm text-amber-100/90">Learn advanced concepts with examples</p>
            </div>
          </div>
        </div>

        {/* VIP workspace shortcuts */}
        <div className="max-w-6xl mx-auto px-4 mb-14">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5 bg-slate-900/60 border border-slate-700 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-200">Pro Challenges</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Pro Challenges</h3>
              <p className="text-sm text-gray-300 mb-4">Learn advanced concepts with examples</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => scrollToSection("pro-exercises")}
              >
                Start
              </Button>
            </Card>

            <Card className="p-5 bg-slate-900/60 border border-slate-700 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-200">AI Code Inspector</span>
              </div>
              <h3 className="text-lg font-bold mb-1">AI Code Inspector</h3>
              <p className="text-sm text-gray-300 mb-4">Automatic analysis with optimization suggestions, warnings, and algorithm explanations.</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => scrollToSection("ai-inspector")}
              >
                Analyze
              </Button>
            </Card>

            <Card className="p-5 bg-slate-900/60 border border-slate-700 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-200">Debugger</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Premium Badge</h3>
              <p className="text-sm text-gray-300 mb-4">Pro Debugger Requires Text</p>
              <Button
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold"
                onClick={handleGoToPricing}
              >
                View Pricing
              </Button>
            </Card>
          </div>
        </div>

        {/* VIP Playground */}
        <div id="vip-playground" className="max-w-6xl mx-auto px-4 mb-14">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/50 via-slate-900/70 to-slate-950/80 p-6 shadow-[0_0_25px_rgba(251,191,36,0.2)] text-white">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/40 text-amber-100 text-xs font-semibold shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                  <Crown className="w-4 h-4" />
                  Pro Playground
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">Pro Playground</h3>
                <p className="text-sm text-amber-100/90">VIP Playground</p>
                <div className="space-y-2 text-sm text-amber-50/90">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 mt-0.5" />
                    <span>Quick experiments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 mt-0.5" />
                    <span>Test code snippets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 mt-0.5" />
                    <span>Share and iterate</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.4)] font-semibold" onClick={() => scrollToSection("pro-exercises")}>
                    Start
                  </Button>
                  <Button variant="outline" className="border-amber-500/60 text-amber-200 hover:bg-amber-500/10" onClick={() => scrollToSection("pro-labs")}>
                    Mini Demos
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/60 p-6 text-white space-y-3 shadow-[0_0_15px_rgba(251,191,36,0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-amber-100">Pro Playground</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(251,191,36,0.3)]" onClick={copyScratchpad}>
                    Pro Playground Copy
                  </Button>
                  <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10" onClick={clearScratchpad}>
                    Pro Playground Clear
                  </Button>
                </div>
              </div>
              <textarea
                className="w-full h-48 rounded-xl bg-slate-950/70 border border-amber-500/20 text-sm text-amber-50 p-3 font-mono focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/20"
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                placeholder="Write or paste code to experiment."
              />
              <p className="text-xs text-slate-300">Write or paste code to experiment.</p>
            </div>
          </div>
        </div>

        {/* Pro Exercises Section */}
        <div id="pro-exercises" className="max-w-6xl mx-auto px-4 mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                <Code2 className="w-4 h-4" />
                Pro Challenges
              </span>
              <p className="text-sm text-gray-400">Pro Challenges</p>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { id: "all", label: "Pro Category All" },
              { id: "algorithms", label: "Pro Category Algorithms" },
              { id: "data-structures", label: "Pro Category Data Structures" },
              { id: "async", label: "Pro Category Async" },
              { id: "performance", label: "Pro Category Performance" },
              { id: "design-patterns", label: "Pro Category Design Patterns" },
            ].map((c: any) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  (category === c.id)
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                    : "bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Difficulty + search */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {[{id:"all",label:"Pro Category All"},{id:"beginner",label:"Beginner"},{id:"intermediate",label:"Intermediate"},{id:"advanced",label:"Advanced"}].map((d:any)=> (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    (difficulty === d.id)
                      ? "bg-purple-500/20 text-purple-200 border-purple-400/40"
                      : "bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >{d.label}</button>
              ))}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                value={query}
                onChange={(e)=> setQuery(e.target.value)}
                placeholder="Search Pro content..."
                className="w-full md:max-w-sm text-sm px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
              <select
                onChange={(e)=> setSort(e.target.value as any)}
                className="text-sm px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700 text-slate-200 focus:outline-none"
              >
                <option value="relevance">Pro Sort Recommended</option>
                <option value="difficulty">Pro Sort Difficulty</option>
                <option value="time">Pro Sort Time</option>
              </select>
            </div>
          </div>

          <ProExercisesGrid
            exercises={getAllProExercises()
              .filter(ex => (category === "all") ? true : ex.category === category)
              .filter(ex => (difficulty === "all") ? true : ex.difficulty.toLowerCase() === difficulty)
              .filter(ex => !query.trim() ? true : (ex.title + " " + ex.description).toLowerCase().includes(query.trim().toLowerCase()))
              .sort((a, b) => {
                if (sort === "difficulty") {
                  const w = { Beginner: 1, Intermediate: 2, Advanced: 3 } as const;
                  return w[a.difficulty] - w[b.difficulty];
                }
                if (sort === "time") {
                  const parse = (s: string) => { const m = s.match(/\d+/); return m ? parseInt(m[0], 10) : 0; };
                  return parse(a.estimatedTime) - parse(b.estimatedTime);
                }
                return 0;
              })}
            completedIds={[]}
            onSelectExercise={(ex) => {
              toast({ title: `$Pro Feature: ${ex.title}`, description: "Pro Challenges" });
            }}
          />
        </div>

        {/* VIP Playground - Advanced Execution */}
        {user?.isPro && (
          <div id="vip-playground" className="max-w-7xl mx-auto px-4 mb-16">
            <Suspense
              fallback={
                <div className="text-center text-white/60 py-10">Loading</div>
              }
            >
              <VIPPlaygroundLazy />
            </Suspense>
          </div>
        )}

        {/* IA Code Inspector - Full Feature */}
        <div id="ai-inspector" className="max-w-6xl mx-auto px-4 mb-16">
          <Suspense
            fallback={
              <div className="text-center text-white/60 py-10">
                Analyzing
              </div>
            }
          >
            <AICodeInspectorLazy />
          </Suspense>
        </div>

        <div id="pro-advanced" className="max-w-6xl mx-auto px-4 mb-16">
          <Suspense fallback={<div className="text-center text-white/60 py-10">Loading</div>}>
            <ProAdvancedFeaturesLazy />
          </Suspense>
        </div>

        <div id="pro-labs" className="max-w-6xl mx-auto px-4 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/50 text-amber-200 text-xs font-semibold shadow-[0_0_10px_rgba(251,191,36,0.25)]">
              <Sparkles className="w-4 h-4" />
              Mini Demos
            </span>
            <p className="text-sm text-amber-200/70">Pro Mini Demos Note</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/60 p-4 space-y-3 shadow-[0_0_15px_rgba(251,191,36,0.12)]">
              <div className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-amber-100">Code Profiler</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-100">
                <span className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40">Profiler Steps</span>
                <span className="text-amber-50/80">Use the profiler to measure function performance.</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {profilerExamples.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => applyProfilerExample(ex.id)}
                    className="px-3 py-1 rounded-full border border-amber-300/40 text-amber-100 bg-black/30 hover:bg-amber-500/10"
                  >
                    {ex.id === 'fib' ? "Profiler Example Fib" : ex.id === 'loop' ? "Profiler Example Loop" : ex.id === 'async' ? "Profiler Example Async" : "Profiler Example Sort"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="inline-flex items-center gap-2 text-xs text-amber-200">
                    <input
                      type="checkbox"
                      checked={profilerShowRealtime}
                      onChange={(e) => setProfilerShowRealtime(e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span className="inline-flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Profiler Realtime Toggle
                    </span>
                  </label>
                </div>
                {profilerShowRealtime ? (
                  <div className="w-full h-32 rounded-lg bg-black/60 border border-amber-400/30 p-3 font-mono text-sm overflow-auto">
                    {profilerCode.split('\n').map((line, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 transition-all duration-200 ${
                          profilerExecutionLine === idx + 1
                            ? 'bg-green-500/40 border-l-2 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                            : 'hover:bg-slate-700/30'
                        }`}
                      >
                        <span className="inline-block w-8 text-amber-300/50 text-right mr-3 select-none">{idx + 1}</span>
                        <span className={profilerExecutionLine === idx + 1 ? 'text-green-100 font-semibold' : 'text-slate-200'}>{line || ' '}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="w-full h-32 rounded-lg bg-black/40 border border-slate-700 text-sm text-white p-3 font-mono"
                    value={profilerCode}
                    onChange={(e) => setProfilerCode(e.target.value)}
                  />
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <label className="inline-flex items-center gap-1">
                    <span>Profiler Config Runs</span>
                    <select
                      value={profilerConfig.runs}
                      onChange={(e) => setProfilerConfig((c) => ({ ...c, runs: parseInt(e.target.value, 10) }))}
                      className="px-2 py-1 rounded bg-black/40 border border-slate-700"
                    >
                      {[3,5,10,20].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <span>Profiler Config Warmup</span>
                    <select
                      value={profilerConfig.warmup}
                      onChange={(e) => setProfilerConfig((c) => ({ ...c, warmup: parseInt(e.target.value, 10) }))}
                      className="px-2 py-1 rounded bg-black/40 border border-slate-700"
                    >
                      {[0,1,2,5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={profilerConfig.captureConsole}
                      onChange={(e) => setProfilerConfig((c) => ({ ...c, captureConsole: e.target.checked }))}
                      className="accent-blue-400"
                    />
                    <span className="inline-flex items-center gap-1"><Activity className="w-3 h-3" /> Profiler Config Capture Console</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={runProfiler} className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                    {`$Run $Profiler x${profilerConfig.runs}`}
                  </Button>
                  {profilerError && <span className="text-sm text-red-300">{profilerError}</span>}
                </div>
              </div>
              {profilerRuns.length > 0 && (
                <div className="bg-black/30 border border-slate-700 rounded-lg p-3 text-sm text-gray-200 space-y-1">
                  {profilerRuns.map((r) => (
                    <div key={r.run} className="flex items-center justify-between">
                      <span className="text-gray-400">Run {r.run}</span>
                      <span className="font-semibold text-blue-300">{r.ms} ms</span>
                    </div>
                  ))}
                </div>
              )}
              {renderTimeline()}
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 space-y-1">
                <div className="font-semibold text-slate-100">What to Watch</div>
                <div>Profiler What to Watch1</div>
                <div>Profiler What to Watch2</div>
                <div>Profiler What to Watch3</div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/60 p-4 space-y-3 shadow-[0_0_15px_rgba(251,191,36,0.12)]">
              <div className="flex items-center gap-2 text-white">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-amber-100">Breakpoint Manager</h3>
              </div>
              <div className="space-y-2">
                {breakpoints.map((bp) => (
                  <div key={bp.id} className="flex items-center gap-2 text-sm text-gray-200 bg-black/30 border border-slate-700 rounded-lg p-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bp.active}
                        onChange={() => toggleBreakpoint(bp.id)}
                        className="accent-blue-400"
                      />
                      <span className="text-slate-200 font-semibold">L{bp.line}</span>
                    </label>
                    <input
                      className="flex-1 bg-transparent border border-slate-700 rounded px-2 py-1 text-xs text-gray-200"
                      value={bp.condition || ""}
                      onChange={(e) =>
                        setBreakpoints((prev) => prev.map((b) => (b.id === bp.id ? { ...b, condition: e.target.value } : b)))
                      }
                      placeholder="Condition"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={addBreakpoint} variant="outline" className="border-slate-600 text-slate-200">
                Add Breakpoint
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/60 p-4 space-y-3 shadow-[0_0_15px_rgba(251,191,36,0.12)]">
            <div className="flex items-center gap-2 text-white">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-amber-100">Variable Inspector</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-amber-50 items-center">
              <span className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-600/30 to-amber-700/30 border border-amber-400/50">Inspector Guide Label</span>
              <span className="text-amber-100/80">Inspector Guide Text</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {inspectorExamples.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => applyInspectorExample(ex.id)}
                  className="px-3 py-1 rounded-full border border-slate-600 text-slate-100 bg-black/30 hover:bg-slate-800/60"
                >
                  {inspectorLabels[ex.id]}
                </button>
              ))}
            </div>
            {selectedInspectorExampleId && (
              <div className="bg-black/30 border border-amber-400/20 rounded p-2 text-xs text-amber-100">
                {selectedInspectorExampleId ? inspectorDescriptions[selectedInspectorExampleId] : ''}
              </div>
            )}
            <div className="flex items-center gap-2 py-1">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-amber-300" />
                <input
                  className="w-full rounded bg-black/40 border border-slate-700 text-sm text-white px-2 py-1"
                  value={inspectorQuery}
                  onChange={(e) => setInspectorQuery(e.target.value)}
                  placeholder="Search inspector..."
                />
              </div>
              {selectedPath && (
                <div className="text-xs text-amber-200 inline-flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Inspector Path Label: <span className="font-mono">{selectedPath}</span>
                </div>
              )}
            </div>
            <textarea
              className="w-full h-32 rounded-lg bg-black/40 border border-slate-700 text-sm text-white p-3 font-mono"
              value={inspectorInput}
              onChange={(e) => setInspectorInput(e.target.value)}
              placeholder="Paste JSON or object to inspect."
            />
            <div className="flex items-center gap-2">
              <Button onClick={parseInspector} className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                Pro Inspector Analyze
              </Button>
              {inspectorError && <span className="text-sm text-red-300">{inspectorError}</span>}
            </div>
            <div className="bg-black/30 border border-slate-700 rounded-lg p-3 min-h-[120px] text-sm text-gray-200">
              {inspectorParsed ? renderObject(inspectorParsed, 0, []) : <span className="text-gray-500">Paste JSON or object to inspect.</span>}
            </div>
            {inspectorInput && (
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-black/25 border border-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-200">
                    <span>Focus</span>
                    <span className="font-mono text-amber-300">{selectedPath || "Inspector Select in Tree"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-amber-50">
                    <span className="px-2 py-1 rounded-full bg-amber-600/25 border border-amber-300/60 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]">{valueKind}</span>
                    {arrayLength !== null && <span className="px-2 py-1 rounded-full bg-amber-600/20 border border-amber-300/50">Inspector Len Label: {arrayLength}</span>}
                    {objectKeysCount !== null && (
                      <span className="px-2 py-1 rounded-full bg-amber-600/20 border border-amber-300/50">Inspector Keys Label: {objectKeysCount}</span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-emerald-600/25 border border-emerald-300/60 text-emerald-50">Stack Heap Hint</span>
                  </div>
                  <pre className="bg-slate-950/70 border border-slate-700 rounded text-xs text-slate-200 p-2 max-h-40 overflow-auto">
                    {selectedValuePreview || "Inspector Select Path Prompt"}
                  </pre>
                  <div className="text-[11px] text-slate-200 space-y-1 bg-slate-800/80 border border-slate-700 rounded p-2">
                    <div className="font-semibold text-slate-100">How to Use the Inspector</div>
                    <div>Inspector How To1</div>
                    <div>Inspector How To2</div>
                    <div>Inspector How To3</div>
                  </div>
                </div>
                {renderCodePreview()}
              </div>
            )}
            {selectedPath && inspectorParsed && (
              <div className="bg-black/20 border border-slate-700 rounded p-3">
                <div className="text-xs text-gray-300 mb-2">Interpreter</div>
                <ul className="text-xs text-gray-200 space-y-1">
                  <li>Inspector Interpreter1</li>
                  <li>Inspector Interpreter2</li>
                  <li>{"Inspector Interpreter3".replace('{path}', selectedPath || '')}</li>
                  <li>Inspector Interpreter4</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-12">
          {user?.isPro ? (
            <Suspense fallback={<div className="text-center p-8 text-white">Pro Debugger Loading</div>}>
              <ProDebuggerLazy />
            </Suspense>
          ) : (
            <div className="max-w-4xl mx-auto text-center text-white space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                <Crown className="w-4 h-4" />
                Pro Debugger Requires Badge
              </div>
              <p className="text-gray-200">Pro Debugger Requires Text</p>
              <Button onClick={handleGoToPricing} className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold h-12">
                View Pricing
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

