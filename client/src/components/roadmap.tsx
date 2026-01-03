import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Play } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/contexts/LanguageContext';
import { runInWorker } from '@/lib/sandbox';
import { useToast } from '@/hooks/use-toast';

type TrackItem = { id: string; title: string; summary: string; sampleCode: string };

type CapstoneTestCase = {
  name: string;
  input: any;
  expected: any;
};

type WeeklyDifficulty = 'easy' | 'medium' | 'hard';

type WeeklyChallengeTestCase = {
  name: string;
  input: any;
  expected: any;
};

type WeeklyChallengeSpec = {
  difficulty: WeeklyDifficulty;
  title: string;
  description: string;
  xpReward: number;
  functionName: string;
  starterCode: string;
  tests: WeeklyChallengeTestCase[];
};

type WeeklyLeaderboardRow = {
  userId: string;
  name: string;
  seconds: number;
  at: string;
};

type CapstoneSpec = {
  level: 'basic' | 'medium' | 'advanced';
  title: string;
  description: string;
  requirements: string[];
  functionName: string;
  starterCode: string;
  tests: CapstoneTestCase[];
};

function estimateMinutesForTopic(title: string) {
  const lower = title.toLowerCase();
  if (/variable|string|number|array|object|loop|function/i.test(lower)) return 6;
  if (/promise|async|await|closure|scope|event loop/i.test(lower)) return 10;
  if (/pattern|security|performance|profiling|architecture|compiler/i.test(lower)) return 12;
  return 8;
}

const TOPICS: any = {
  javascript: {
    basic: [
      'Variables & types', 'Strings & templates', 'Numbers & arithmetic', 'Arrays', 'Objects', 'Control flow', 'Loops', 'Functions', 'Arrow functions', 'Scope & hoisting', 'DOM basics', 'Events', 'Promises intro', 'Array methods', 'Debugging basics'
    ],
    medium: [
      'Closures', 'Async/await', 'Modules', 'Fetch & APIs', 'Higher-order functions', 'Event loop', 'Error handling', 'RegExp', 'Map/Set', 'LocalStorage', 'Testing basics', 'Performance tips', 'Functional patterns', 'Tooling (babel)', 'Bundlers'
    ],
    advanced: [
      'Design patterns', 'Memory & perf', 'Streams', 'WebWorkers', 'Advanced async', 'Reactive programming', 'TypeScript intro', 'Compiler basics', 'Security', 'Patterns for scale', 'Optimization', 'Profiling', 'Metaprogramming', 'Ecosystem patterns', 'Server-side rendering'
    ],
  },
  python: {
    basic: [
      'Variables & types', 'Strings', 'Numbers', 'Lists', 'Dictionaries', 'Control flow', 'Loops', 'Functions', 'Comprehensions', 'Modules', 'File I/O', 'Exceptions', 'Virtualenv intro', 'Basic testing', 'Debugging'
    ],
    medium: [
      'Generators', 'Iterators', 'Decorators', 'Asyncio basics', 'OOP patterns', 'Context managers', 'Packaging', 'Requests & APIs', 'Data handling', 'Pandas intro', 'Testing (pytest)', 'Logging', 'Type hints', 'Profiling', 'Memory'
    ],
    advanced: [
      'Concurrency', 'C extensions', 'Metaclasses', 'Descriptors', 'Advanced profiling', 'Caching patterns', 'Security', 'Deployment', 'Scaling apps', 'Profiling', 'Performance tuning', 'GC internals', 'Design at scale', 'Async patterns', 'Tooling'
    ],
  },
  java: {
    basic: [
      'Variables & types', 'Strings', 'Operators', 'Arrays', 'Collections intro', 'Control flow', 'Loops', 'Methods', 'Classes & objects', 'Constructors', 'Packages', 'Exceptions', 'I/O basics', 'Debugging', 'Build (Maven)'
    ],
    medium: [
      'Generics', 'Collections deeper', 'Streams API', 'Concurrency basics', 'OOP patterns', 'Testing (JUnit)', 'Modules', 'I/O NIO', 'Annotations', 'Logging', 'Serialization', 'Dependency injection', 'Build tools', 'Profiling', 'JVM tuning'
    ],
    advanced: [
      'JVM internals', 'Garbage collection', 'Concurrency advanced', 'Reactive streams', 'Performance tuning', 'Native interop', 'Security', 'Microservices', 'Profiling', 'Memory model', 'Classloading', 'Custom classloaders', 'Instrumentation', 'Deployment', 'Scaling'
    ],
  },
};

function sampleFor(topic: string, lang: string, idx: number) {
  const n = idx + 1;
  if (lang === 'python') {
    return `# ${topic}\ndef example_${n}():\n    # example for ${topic}\n    print(${n})\n`;
  }
  if (lang === 'java') {
    return `// ${topic}\npublic class Example${n} {\n  public static void main(String[] args) {\n    System.out.println(${n});\n  }\n}\n`;
  }
  // default javascript
  // Provide a more instructive default for common beginner topics
  if (/variable/i.test(topic)) {
    return `// ${topic}\nfunction example${n}() {\n  // Use a variable to store a value and return it\n  const x = ${n};\n  return x;\n}\n`;
  }

  if (/string/i.test(topic)) {
    return `// ${topic}\nfunction example${n}() {\n  // Return a string for validation\n  return 'hello${n}';\n}\n`;
  }

  if (/number|numeric|arithmetic|numbers/i.test(topic)) {
    return `// ${topic}\nfunction example${n}() {\n  return ${n};\n}\n`;
  }

  if (/array|list/i.test(topic)) {
    return `// ${topic}\nfunction example${n}() {\n  return [${n}, ${n + 1}];\n}\n`;
  }

  if (/object/i.test(topic)) {
    return `// ${topic}\nfunction example${n}() {\n  return { id: ${n}, name: 'item${n}' };\n}\n`;
  }

  // Fallback: return the numeric id to allow simple validation
  return `// ${topic}\nfunction example${n}() {\n  return ${n};\n}\n`;
}

// Return teaching content and a validator for a given topic title
function getLessonSpec(title: string, sampleCode: string, idx: number) {
  const n = idx + 1;
  const lower = title.toLowerCase();
  if (/variable/i.test(lower)) {
    return {
      teaching: (
        <div className="mt-4 text-sm space-y-3">
          <div className="inline-block px-3 py-1 rounded bg-amber-700/20 text-amber-200 font-semibold">What is a variable?</div>
          <div className="text-gray-200">A variable is a named container for a value — like a labeled box. You put a value inside and use the name to get it later.</div>
          <div className="inline-block px-3 py-1 rounded bg-slate-800/60 text-slate-200 font-semibold">How to use it</div>
          <div className="text-gray-200">Create a variable with <span className="font-mono">const</span> or <span className="font-mono">let</span>, store a value, then return that value from the function.</div>
          <div className="inline-block px-3 py-1 rounded bg-emerald-700/10 text-emerald-200 font-semibold">Activity</div>
          <div className="text-gray-200">Edit the function so it stores a value in a variable and returns it. The validator expects <strong className="text-amber-300">{n}</strong>.</div>
        </div>
      ),
      validate: (res: any) => {
        if (res === n) return { ok: true, message: `Returned ${JSON.stringify(res)}` };
        return { ok: false, message: `Expected ${JSON.stringify(n)}, got ${JSON.stringify(res)}` };
      },
    };
  }

  if (/string/i.test(lower)) {
    return {
      teaching: (
        <div className="mt-4 text-sm space-y-3">
          <div className="inline-block px-3 py-1 rounded bg-amber-700/20 text-amber-200 font-semibold">What is a string?</div>
          <div className="text-gray-200">A string is text. Use quotes and return the text value from the function.</div>
          <div className="inline-block px-3 py-1 rounded bg-emerald-700/10 text-emerald-200 font-semibold">Activity</div>
          <div className="text-gray-200">Edit the function to return the exact string <strong className="text-amber-300">"hello{n}"</strong>.</div>
        </div>
      ),
      validate: (res: any) => {
        const expect = `hello${n}`;
        if (res === expect) return { ok: true, message: `Returned ${JSON.stringify(res)}` };
        return { ok: false, message: `Expected ${JSON.stringify(expect)}, got ${JSON.stringify(res)}` };
      },
    };
  }

  if (/array|list/i.test(lower)) {
    return {
      teaching: (
        <div className="mt-4 text-sm space-y-3">
          <div className="inline-block px-3 py-1 rounded bg-amber-700/20 text-amber-200 font-semibold">What is an array?</div>
          <div className="text-gray-200">An array (or list) holds items in order. You can return an array and the validator will check its elements.</div>
          <div className="inline-block px-3 py-1 rounded bg-emerald-700/10 text-emerald-200 font-semibold">Activity</div>
          <div className="text-gray-200">Edit the function so it returns an array whose first element equals <strong className="text-amber-300">{n}</strong>.</div>
        </div>
      ),
      validate: (res: any) => {
        if (Array.isArray(res) && res[0] === n) return { ok: true, message: `Returned array, first element ${JSON.stringify(res[0])}` };
        return { ok: false, message: `Expected an array with first element ${JSON.stringify(n)}, got ${JSON.stringify(res)}` };
      },
    };
  }

  // Default minimal teaching and validation: function should return a value equal to n
  return {
    teaching: (
      <div className="mt-4 text-sm text-gray-200 space-y-3">
        <div className="font-semibold">Quick task</div>
        <div>Modify the function to return the shown example result. Click Run to validate.</div>
      </div>
    ),
    validate: (res: any) => {
      if (res === n) return { ok: true, message: `Returned ${JSON.stringify(res)}` };
      return { ok: false, message: `Expected ${JSON.stringify(n)}, got ${JSON.stringify(res)}` };
    },
  };
}

function friendlyErrorMessage(err: any) {
  const msg = err?.message || String(err || '');
  if (/ReferenceError/i.test(msg)) return 'Reference or name not found. Check variable and function names.';
  if (/SyntaxError/i.test(msg)) return 'Syntax error. Check your code formatting.';
  if (/TypeError/i.test(msg)) return 'Type error. Check function calls and expected types.';
  return msg;
}

function stableStringify(value: any) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function deepEqualJson(a: any, b: any) {
  return stableStringify(a) === stableStringify(b);
}

function hashStringToInt(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getISOWeekKey(d = new Date()) {
  // ISO week date weeks start on Monday.
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = date.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

function makeItems(level: 'basic' | 'medium' | 'advanced', lang: string): TrackItem[] {
  const langTopics = (TOPICS as any)[lang];
  // If this language doesn't define topics for the requested level, return an empty list.
  if (!langTopics || !Array.isArray(langTopics[level])) return [];
  const topics = langTopics[level];
  return topics.slice(0, 15).map((t: string, i: number) => ({
    id: `${level.toLowerCase()}-${i + 1}`,
    title: `${i + 1}. ${t}`,
    summary: `${t} — core concepts and common patterns.`,
    sampleCode: sampleFor(t, lang, i),
  }));
}

function CodePreview({ code, playing, onPlay }: { code: string; playing: boolean; onPlay: () => void }) {
  const lines = code.split('\n');
  const [current, setCurrent] = useState(0);

  React.useEffect(() => {
    if (!playing) return;
    setCurrent(0);
    const iv = setInterval(() => {
      setCurrent((c) => {
        if (c >= lines.length - 1) {
          clearInterval(iv);
          return c;
        }
        return c + 1;
      });
    }, 400);
    return () => clearInterval(iv);
  }, [playing, code]);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded p-2 font-mono text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Button size="sm" variant="ghost" onClick={onPlay} className="gap-2"><Play className="w-4 h-4" /> Run Preview</Button>
        <div className="text-xs text-gray-400">Line-by-line execution preview</div>
      </div>
      <div className="overflow-auto max-h-40">
        {lines.map((l, idx) => (
          <div key={idx} className={`px-2 py-0.5 ${idx === current ? 'bg-amber-700/30 text-white' : 'text-gray-300'}`}>
            <span className="text-xs text-gray-400 mr-2">{idx + 1}</span>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function TrackPath({
  items,
  disabledAll,
  unlockedIndex,
  onSelect,
  columns = 5,
}: {
  items: TrackItem[];
  disabledAll: boolean;
  unlockedIndex: number;
  onSelect: (item: TrackItem, disabled: boolean, idx: number) => void;
  columns?: number;
}) {
  const rows = useMemo(() => chunk(items, columns), [items, columns]);
  return (
    <div className="space-y-4">
      {rows.map((row, rowIndex) => {
        const reverse = rowIndex % 2 === 1;
        const rowItems = reverse ? [...row].reverse() : row;
        const rowStartIndex = rowIndex * columns;
        const endIsRight = !reverse;
        return (
          <div key={rowIndex} className="relative">
            <div className="relative rounded-xl bg-slate-900/30 border border-white/5 p-3">
              {/* Horizontal connector */}
              <div className="pointer-events-none absolute left-6 right-6 top-8 h-px bg-white/10" />

              <div className={`flex items-start justify-between gap-2 ${reverse ? 'flex-row-reverse' : ''}`}>
                {rowItems.map((it, innerIdx) => {
                  const absoluteIdx = rowStartIndex + (reverse ? row.length - 1 - innerIdx : innerIdx);
                  const seqLocked = absoluteIdx > unlockedIndex;
                  const disabled = disabledAll || seqLocked;
                  const completed = absoluteIdx < unlockedIndex;
                  const isNext = absoluteIdx === unlockedIndex;

                  return (
                    <button
                      key={it.id}
                      onClick={() => onSelect(it, disabled, absoluteIdx)}
                      disabled={disabled}
                      className={`group w-[calc(20%-0.5rem)] min-w-[130px] md:min-w-0 text-left transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                      title={it.title.replace(/^[0-9]+\.\s*/, '')}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shadow-sm ${
                            disabled
                              ? 'bg-slate-800 text-gray-400 border-white/10'
                              : completed
                                ? 'bg-emerald-400 text-slate-900 border-emerald-200/60'
                                : isNext
                                  ? 'bg-amber-400 text-slate-900 border-amber-200/70'
                                  : 'bg-slate-800 text-white border-white/10'
                          }`}
                        >
                          {absoluteIdx + 1}
                        </div>
                        <div className="mt-2 text-xs font-medium text-gray-200 text-center line-clamp-2">
                          {it.title.replace(/^[0-9]+\.\s*/, '')}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400 text-center line-clamp-1">
                          {disabledAll ? '🔒 Pro' : seqLocked ? '🔒 Locked' : completed ? '✓ Done' : '▶ Start'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Vertical connector to next row */}
              {rowIndex < rows.length - 1 && (
                <div
                  className={`pointer-events-none absolute top-10 h-10 w-px bg-white/10 ${endIsRight ? 'right-6' : 'left-6'}`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LearningTrack() {
  const { user, refreshUser } = useUser();
  const { progLang, setProgLang } = useLanguage();
  const lang = (progLang || 'javascript') as string;
  const basic = useMemo(() => makeItems('basic', lang), [lang]);
  const medium = useMemo(() => makeItems('medium', lang), [lang]);
  const advanced = useMemo(() => makeItems('advanced', lang), [lang]);

  const [openCertificate, setOpenCertificate] = useState(false);
  const [certificateIssuedAt, setCertificateIssuedAt] = useState<string | null>(null);

  const [resume, setResume] = useState<{ level: 'basic' | 'medium' | 'advanced'; index: number; title?: string } | null>(null);

  const [openItem, setOpenItem] = useState<TrackItem | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [currentVars, setCurrentVars] = useState<Record<string, any> | null>(null);
  const [lessonStage, setLessonStage] = useState<'overview' | 'step' | 'result'>('overview');
  const [editorCode, setEditorCode] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveLine, setLiveLine] = useState<number | null>(null);
  const { toast } = useToast();

  const [openCapstone, setOpenCapstone] = useState<CapstoneSpec | null>(null);
  const [capstoneStage, setCapstoneStage] = useState<'overview' | 'work' | 'result'>('overview');
  const [capstoneCode, setCapstoneCode] = useState('');
  const [capstoneMsg, setCapstoneMsg] = useState<string | null>(null);
  const [capstoneRunning, setCapstoneRunning] = useState(false);

  const weekKey = useMemo(() => getISOWeekKey(new Date()), []);
  const [openWeekly, setOpenWeekly] = useState<WeeklyChallengeSpec | null>(null);
  const [weeklyStage, setWeeklyStage] = useState<'overview' | 'work' | 'result'>('overview');
  const [weeklyCode, setWeeklyCode] = useState('');
  const [weeklyMsg, setWeeklyMsg] = useState<string | null>(null);
  const [weeklyRunning, setWeeklyRunning] = useState(false);
  const [weeklyStartTs, setWeeklyStartTs] = useState<number | null>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<WeeklyLeaderboardRow[]>([]);

  const getUnlockedIndex = (level: 'basic' | 'medium' | 'advanced') => {
    try {
      return Number(localStorage.getItem(`unlocked-${lang}-${level}`) || '0') || 0;
    } catch {
      return 0;
    }
  };

  const progressFor = (level: 'basic' | 'medium' | 'advanced', total: number) => {
    const unlocked = Math.min(getUnlockedIndex(level), total);
    const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { unlocked, total, pct };
  };

  const capstones = useMemo<CapstoneSpec[]>(() => {
    const commonFn = 'capstone';
    return [
      {
        level: 'basic',
        title: 'Capstone: To‑Do Actions Engine',
        description: 'Implement a small, real-world state engine: apply a list of actions to produce the final To‑Do list.',
        requirements: [
          'Implement a pure function (no DOM, no globals)',
          'Return the final list of todos (with done flags)',
          'Handle add/toggle actions in order',
        ],
        functionName: commonFn,
        starterCode: `// Basic Capstone: To‑Do Actions Engine\n// Implement capstone(actions)\n// actions example: [{ type: 'add', text: 'Buy milk' }, { type: 'toggle', id: 1 }]\n\nfunction capstone(actions) {\n  // TODO: return an array like: [{ id: 1, text: 'Buy milk', done: true }]\n  // Tip: assign ids starting at 1 in order of "add" actions.\n  return [];\n}\n`,
        tests: [
          {
            name: 'Add two, toggle first',
            input: [
              { type: 'add', text: 'Buy milk' },
              { type: 'add', text: 'Write code' },
              { type: 'toggle', id: 1 },
            ],
            expected: [
              { id: 1, text: 'Buy milk', done: true },
              { id: 2, text: 'Write code', done: false },
            ],
          },
        ],
      },
      {
        level: 'medium',
        title: 'Capstone: Rate Limiter',
        description: 'Implement a tiny rate limiter: given timestamps, decide which requests are allowed.',
        requirements: [
          'Implement a pure function',
          'Allow at most `limit` events within `windowMs`',
          'Return an array of booleans (allowed/blocked) matching the input order',
        ],
        functionName: commonFn,
        starterCode: `// Medium Capstone: Rate Limiter\n// Implement capstone({ events, limit, windowMs })\n// events is an array of timestamps (ms), sorted ascending\n\nfunction capstone(input) {\n  const { events, limit, windowMs } = input;\n  // TODO: return boolean[] indicating whether each event is allowed\n  return events.map(() => true);\n}\n`,
        tests: [
          {
            name: '3 per 1000ms',
            input: { events: [0, 10, 20, 900, 950, 1005], limit: 3, windowMs: 1000 },
            expected: [true, true, true, false, false, true],
          },
        ],
      },
      {
        level: 'advanced',
        title: 'Capstone: Dependency Order (Topo Sort)',
        description: 'Given dependencies, produce a valid execution order (topological sort) or an empty array if impossible.',
        requirements: [
          'Implement a pure function',
          'Return an array of node ids in a valid order',
          'If a cycle exists, return []',
        ],
        functionName: commonFn,
        starterCode: `// Advanced Capstone: Dependency Order (Topo Sort)\n// Implement capstone({ nodes, edges })\n// edges: [from, to] meaning "from must come before to"\n\nfunction capstone(input) {\n  const { nodes, edges } = input;\n  // TODO: return a valid order or [] if there is a cycle\n  return [];\n}\n`,
        tests: [
          {
            name: 'Simple DAG',
            input: { nodes: ['a', 'b', 'c'], edges: [['a', 'b'], ['b', 'c']] },
            expected: ['a', 'b', 'c'],
          },
          {
            name: 'Cycle returns empty',
            input: { nodes: ['a', 'b'], edges: [['a', 'b'], ['b', 'a']] },
            expected: [],
          },
        ],
      },
    ];
  }, []);

  const weeklyChallenges = useMemo(() => {
    const fn = 'solve';
    const seed = hashStringToInt(`${weekKey}:${lang}`);

    const easyPool: Omit<WeeklyChallengeSpec, 'difficulty'>[] = [
      {
        title: 'Weekly Easy: Sum of Numbers',
        description: 'Implement solve(nums) that returns the sum of an array of numbers.',
        xpReward: 25,
        functionName: fn,
        starterCode: `// Weekly Easy: Sum of Numbers\n// Implement solve(nums) -> number\n\nfunction solve(nums) {\n  // TODO\n  return 0;\n}\n`,
        tests: [
          { name: 'Simple', input: [1, 2, 3], expected: 6 },
          { name: 'With negatives', input: [10, -3, -7], expected: 0 },
        ],
      },
      {
        title: 'Weekly Easy: Count Vowels',
        description: 'Implement solve(s) that counts vowels (a,e,i,o,u) in a string.',
        xpReward: 25,
        functionName: fn,
        starterCode: `// Weekly Easy: Count Vowels\n// Implement solve(s) -> number\n\nfunction solve(s) {\n  // TODO\n  return 0;\n}\n`,
        tests: [
          { name: 'hello', input: 'hello', expected: 2 },
          { name: 'CODEFLOW', input: 'CODEFLOW', expected: 3 },
        ],
      },
    ];

    const mediumPool: Omit<WeeklyChallengeSpec, 'difficulty'>[] = [
      {
        title: 'Weekly Medium: Unique Characters',
        description: 'Implement solve(s) that returns true if all characters are unique (case sensitive).',
        xpReward: 50,
        functionName: fn,
        starterCode: `// Weekly Medium: Unique Characters\n// Implement solve(s) -> boolean\n\nfunction solve(s) {\n  // TODO\n  return false;\n}\n`,
        tests: [
          { name: 'abc', input: 'abc', expected: true },
          { name: 'abca', input: 'abca', expected: false },
        ],
      },
      {
        title: 'Weekly Medium: Frequency Map',
        description: 'Implement solve(arr) that returns an object mapping each value to its count.',
        xpReward: 50,
        functionName: fn,
        starterCode: `// Weekly Medium: Frequency Map\n// Implement solve(arr) -> { [key: string]: number }\n\nfunction solve(arr) {\n  // TODO\n  return {};\n}\n`,
        tests: [
          { name: 'numbers', input: [1, 2, 2, 3], expected: { '1': 1, '2': 2, '3': 1 } },
          { name: 'strings', input: ['a', 'b', 'a'], expected: { a: 2, b: 1 } },
        ],
      },
    ];

    const hardPool: Omit<WeeklyChallengeSpec, 'difficulty'>[] = [
      {
        title: 'Weekly Hard: Valid Parentheses',
        description: 'Implement solve(s) that checks if (), {}, [] are balanced and properly nested.',
        xpReward: 100,
        functionName: fn,
        starterCode: `// Weekly Hard: Valid Parentheses\n// Implement solve(s) -> boolean\n\nfunction solve(s) {\n  // TODO\n  return false;\n}\n`,
        tests: [
          { name: 'balanced', input: '([]){}', expected: true },
          { name: 'wrong order', input: '([)]', expected: false },
          { name: 'missing close', input: '(()', expected: false },
        ],
      },
      {
        title: 'Weekly Hard: Sliding Window Max Sum',
        description: 'Implement solve({ nums, k }) that returns the maximum sum of any contiguous subarray of length k.',
        xpReward: 100,
        functionName: fn,
        starterCode: `// Weekly Hard: Sliding Window Max Sum\n// Implement solve({ nums, k }) -> number\n\nfunction solve(input) {\n  const { nums, k } = input;\n  // TODO\n  return 0;\n}\n`,
        tests: [
          { name: 'k=2', input: { nums: [1, 2, 3, 4], k: 2 }, expected: 7 },
          { name: 'mixed', input: { nums: [-1, 2, 3, -5, 4], k: 2 }, expected: 5 },
        ],
      },
    ];

    const pick = <T,>(arr: T[], s: number) => arr[s % arr.length];

    return {
      easy: { difficulty: 'easy' as const, ...pick(easyPool, seed + 1) },
      medium: { difficulty: 'medium' as const, ...pick(mediumPool, seed + 2) },
      hard: { difficulty: 'hard' as const, ...pick(hardPool, seed + 3) },
    };
  }, [weekKey, lang]);

  const weeklyCompletionKey = (difficulty: WeeklyDifficulty, userId: string) => `weekly-complete:${weekKey}:${lang}:${difficulty}:${userId}`;
  const weeklyLeaderboardKey = (difficulty: WeeklyDifficulty) => `weekly-leaderboard:${weekKey}:${lang}:${difficulty}`;

  const getWeeklyLeaderboard = (difficulty: WeeklyDifficulty) => {
    try {
      const raw = localStorage.getItem(weeklyLeaderboardKey(difficulty));
      const j = raw ? JSON.parse(raw) : [];
      return Array.isArray(j) ? (j as WeeklyLeaderboardRow[]) : [];
    } catch {
      return [] as WeeklyLeaderboardRow[];
    }
  };

  const setWeeklyLeaderboardRows = (difficulty: WeeklyDifficulty, rows: WeeklyLeaderboardRow[]) => {
    try {
      localStorage.setItem(weeklyLeaderboardKey(difficulty), JSON.stringify(rows));
    } catch {
      // ignore
    }
    setWeeklyLeaderboard(rows);
  };

  const weeklyUserId = user?.id || 'anonymous';
  const weeklyUserName = (user?.firstName || user?.lastName)
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : (user?.email ? (user.email.split('@')[0] || 'User') : 'Anonymous');

  const hasCompletedWeekly = (difficulty: WeeklyDifficulty) => {
    try {
      return localStorage.getItem(weeklyCompletionKey(difficulty, weeklyUserId)) != null;
    } catch {
      return false;
    }
  };

  const openWeeklyChallenge = (difficulty: WeeklyDifficulty) => {
    const spec = weeklyChallenges[difficulty];
    setOpenWeekly(spec);
    setWeeklyStage('overview');
    setWeeklyCode(spec.starterCode);
    setWeeklyMsg(null);
    setWeeklyRunning(false);
    setWeeklyStartTs(Date.now());
    setWeeklyLeaderboard(getWeeklyLeaderboard(difficulty));
  };

  const runWeeklyChallenge = async () => {
    if (!openWeekly) return;
    setWeeklyRunning(true);
    setWeeklyMsg(null);
    try {
      if (lang !== 'javascript') {
        setWeeklyMsg('Automated validation is available for JavaScript weekly challenges only.');
        return;
      }

      for (const t of openWeekly.tests) {
        const res = await runInWorker(weeklyCode, openWeekly.functionName, [t.input], { timeoutMs: 7000 });
        if (!deepEqualJson(res, t.expected)) {
          throw new Error(`${t.name}: expected ${stableStringify(t.expected)}, got ${stableStringify(res)}`);
        }
      }

      const elapsed = weeklyStartTs ? Math.max(1, Math.round((Date.now() - weeklyStartTs) / 1000)) : 0;
      const nowIso = new Date().toISOString();
      const already = hasCompletedWeekly(openWeekly.difficulty);

      setWeeklyMsg('✅ All tests passed. Weekly challenge completed!');
      setWeeklyStage('result');

      // Persist completion + leaderboard (local)
      try {
        if (!already) {
          localStorage.setItem(weeklyCompletionKey(openWeekly.difficulty, weeklyUserId), JSON.stringify({ seconds: elapsed, at: nowIso }));
        }
      } catch {}

      if (!already) {
        const rows = getWeeklyLeaderboard(openWeekly.difficulty);
        const nextRow: WeeklyLeaderboardRow = { userId: weeklyUserId, name: weeklyUserName, seconds: elapsed, at: nowIso };
        const merged = [nextRow, ...rows.filter((r) => r.userId !== weeklyUserId)];
        merged.sort((a, b) => (a.seconds - b.seconds) || a.at.localeCompare(b.at));
        setWeeklyLeaderboardRows(openWeekly.difficulty, merged.slice(0, 10));
      }

      // Rewards (server): grant XP which awards coins too.
      if (!already) {
        const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
        if (token && user?.id) {
          try {
            const res = await fetch('/api/activity/grant-xp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ activityType: 'weekly_challenge', xpAmount: openWeekly.xpReward, lessonId: `weekly:${weekKey}:${openWeekly.difficulty}` }),
            });
            if (res.ok) {
              const j = await res.json();
              toast({ title: 'Weekly reward claimed', description: `+${j.xpEarned} XP • +${j.coinsEarned} FlowCoins` });
              refreshUser?.();
            } else {
              toast({ title: 'Challenge completed', description: 'Reward could not be claimed (auth/server).' });
            }
          } catch {
            toast({ title: 'Challenge completed', description: 'Reward could not be claimed (network).' });
          }
        } else {
          toast({ title: 'Challenge completed', description: 'Sign in to claim XP/FlowCoins rewards.' });
        }
      } else {
        toast({ title: 'Challenge already completed', description: 'Leaderboard updated only on first completion.' });
      }
    } catch (err: any) {
      const friendly = friendlyErrorMessage(err);
      setWeeklyMsg('❌ ' + friendly);
      setWeeklyStage('result');
      toast({ title: 'Weekly challenge failed', description: 'Some tests did not pass.' });
    } finally {
      setWeeklyRunning(false);
    }
  };

  const capstoneKey = (level: 'basic' | 'medium' | 'advanced') => `capstone-completed-${lang}-${level}`;
  const isCapstoneDone = (level: 'basic' | 'medium' | 'advanced') => {
    try {
      return localStorage.getItem(capstoneKey(level)) === '1';
    } catch {
      return false;
    }
  };

  const certificateKey = useMemo(() => `certificate-issued-${lang}`, [lang]);
  const isCertificateEligible = isCapstoneDone('basic') && isCapstoneDone('medium') && isCapstoneDone('advanced');

  useEffect(() => {
    try {
      setCertificateIssuedAt(localStorage.getItem(certificateKey));
    } catch {
      setCertificateIssuedAt(null);
    }
  }, [certificateKey]);

  useEffect(() => {
    if (!isCertificateEligible) return;
    try {
      const existing = localStorage.getItem(certificateKey);
      if (existing) {
        setCertificateIssuedAt(existing);
        return;
      }
      const issued = new Date().toISOString();
      localStorage.setItem(certificateKey, issued);
      setCertificateIssuedAt(issued);
    } catch {
      // ignore
    }
  }, [certificateKey, isCertificateEligible]);

  const learnerName = useMemo(() => {
    const fn = (user?.firstName || '').trim();
    const ln = (user?.lastName || '').trim();
    const full = `${fn} ${ln}`.trim();
    if (full) return full;

    const email = (user?.email || '').trim();
    if (email) return email.split('@')[0] || 'Learner';
    return 'Learner';
  }, [user?.firstName, user?.lastName, user?.email]);

  const copyToClipboard = async (text: string, okMsg: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast({ title: okMsg });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.' });
    }
  };

  const downloadCertificateHtml = () => {
    const issued = certificateIssuedAt ? new Date(certificateIssuedAt) : new Date();
    const date = isFinite(issued.getTime()) ? issued.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const title = `CodeFlow Certificate — ${String(lang).toUpperCase()} Learning Path`;
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 32px;">
    <div style="max-width: 900px; margin: 0 auto; border: 1px solid rgba(0,0,0,.15); border-radius: 12px; padding: 28px;">
      <h1 style="margin: 0 0 10px 0; font-size: 28px;">Certificate of Completion</h1>
      <p style="margin: 0 0 18px 0; color: rgba(0,0,0,.75);">CodeFlow Learning</p>
      <p style="font-size: 18px; margin: 18px 0 8px 0;">This certifies that</p>
      <div style="font-size: 26px; font-weight: 700; margin: 0 0 14px 0;">${learnerName}</div>
      <p style="font-size: 18px; margin: 0 0 18px 0;">has completed the <strong>${String(lang).toUpperCase()}</strong> Learning Path (Basic, Medium, Advanced).</p>
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 18px;">
        <div><strong>Issued</strong>: ${date}</div>
        <div><strong>Tracks</strong>: Basic • Medium • Advanced</div>
      </div>
    </div>
  </body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeflow-certificate-${String(lang).toLowerCase()}-${date}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openCapstoneFor = (level: 'basic' | 'medium' | 'advanced') => {
    const spec = capstones.find((c) => c.level === level);
    if (!spec) return;
    setOpenCapstone(spec);
    setCapstoneStage('overview');
    setCapstoneCode(spec.starterCode);
    setCapstoneMsg(null);
  };

  const runCapstone = async () => {
    if (!openCapstone) return;
    setCapstoneRunning(true);
    setCapstoneMsg(null);
    try {
      if (lang !== 'javascript') {
        setCapstoneMsg('Automated validation is available for JavaScript capstones only.');
        return;
      }

      const alreadyCompleted = isCapstoneDone(openCapstone.level);

      for (const t of openCapstone.tests) {
        const res = await runInWorker(capstoneCode, openCapstone.functionName, [t.input], { timeoutMs: 7000 });

        // Advanced topo sort can have multiple valid outputs; validate constraints when expected is a known order.
        if (openCapstone.level === 'advanced' && Array.isArray(res)) {
          const input = t.input as { nodes: string[]; edges: Array<[string, string]> };
          const nodes = input?.nodes || [];
          const edges = input?.edges || [];

          if (Array.isArray(t.expected) && t.expected.length === 0) {
            // cycle test expects []
            if (res.length !== 0) throw new Error(`${t.name}: expected [], got ${stableStringify(res)}`);
          } else {
            // Validate it's a permutation of nodes and respects edges.
            if (res.length !== nodes.length) throw new Error(`${t.name}: expected ${nodes.length} nodes, got ${res.length}`);
            const pos = new Map<string, number>();
            res.forEach((n: any, idx: number) => pos.set(String(n), idx));
            for (const n of nodes) {
              if (!pos.has(n)) throw new Error(`${t.name}: missing node ${n}`);
            }
            for (const [from, to] of edges) {
              const pf = pos.get(from);
              const pt = pos.get(to);
              if (pf === undefined || pt === undefined || pf >= pt) {
                throw new Error(`${t.name}: invalid order (edge ${from} -> ${to} not respected)`);
              }
            }
          }
        } else {
          if (!deepEqualJson(res, t.expected)) {
            throw new Error(`${t.name}: expected ${stableStringify(t.expected)}, got ${stableStringify(res)}`);
          }
        }
      }

      setCapstoneMsg('✅ All tests passed. Great job!');
      setCapstoneStage('result');
      toast({ title: 'Capstone completed', description: 'All automated tests passed.' });
      try {
        localStorage.setItem(capstoneKey(openCapstone.level), '1');
      } catch {}

      if (!alreadyCompleted) {
        toast({ title: 'Badge earned', description: `You earned the ${openCapstone.level} track badge.` });
      }
    } catch (err: any) {
      const friendly = friendlyErrorMessage(err);
      setCapstoneMsg('❌ ' + friendly);
      setCapstoneStage('result');
      toast({ title: 'Capstone failed', description: 'Some tests did not pass.' });
    } finally {
      setCapstoneRunning(false);
    }
  };

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('openTrackItem');
        if (!raw) { setResume(null); return; }
        const j = JSON.parse(raw);
        const level = String(j?.level || '').toLowerCase();
        const index = Number(j?.index);
        if ((level === 'basic' || level === 'medium' || level === 'advanced') && Number.isFinite(index) && index >= 0) {
          setResume({ level, index, title: typeof j?.title === 'string' ? j.title : undefined });
        } else {
          setResume(null);
        }
      } catch {
        setResume(null);
      }
    };

    load();
    const onEvt = () => load();
    window.addEventListener('openTrackItem', onEvt as any);
    return () => window.removeEventListener('openTrackItem', onEvt as any);
  }, [lang]);

  const handleClick = (item: TrackItem, locked: boolean, level?: string, index?: number) => {
    if (locked) {
      // If track is Pro-locked, redirect to pricing
      const url = new URL(window.location.origin + '/pricing');
      url.searchParams.set('product', 'pro');
      url.searchParams.set('returnTo', window.location.pathname + window.location.search);
      window.location.href = url.toString();
      return;
    }

    const payload = { level: level || 'basic', index: typeof index === 'number' ? index : Number(item.id.split('-')[1]) - 1, sampleCode: item.sampleCode, title: item.title };
    try {
      localStorage.setItem('openTrackItem', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('openTrackItem', { detail: payload }));
    } catch (e) {
      // ignore
    }

    // Open preview modal in-place (no navigation)
    setOpenItem(item);
    setLessonStage('overview');
    setStepIndex(0);
    setEditorCode(item.sampleCode || '');
  };

  const professionPaths = useMemo(
    () =>
      [
        {
          id: 'frontend',
          title: 'Frontend Developer',
          steps: ['HTML', 'CSS', 'JavaScript', 'React'],
          recommendedProgLang: 'javascript' as const,
        },
        {
          id: 'backend',
          title: 'Backend Developer',
          steps: ['Python', 'Databases', 'APIs'],
          recommendedProgLang: 'python' as const,
        },
        {
          id: 'data_science',
          title: 'Data Science',
          steps: ['Python', 'Pandas', 'ML'],
          recommendedProgLang: 'python' as const,
        },
        {
          id: 'mobile',
          title: 'Mobile Developer',
          steps: ['JavaScript', 'React Native'],
          recommendedProgLang: 'javascript' as const,
        },
      ] as const,
    []
  );

  const startProfessionPath = (pathId: (typeof professionPaths)[number]['id']) => {
    const p = professionPaths.find((x) => x.id === pathId);
    if (!p) return;

    try {
      setProgLang(p.recommendedProgLang);
    } catch {
      // ignore
    }

    // Start at the first activity for the recommended language.
    const first = makeItems('basic', p.recommendedProgLang)[0];
    if (!first) return;
    handleClick(first, false, 'basic', 0);
  };

  // Live syntax check (debounced) while editing in lesson step
  useEffect(() => {
    if (lessonStage !== 'step') return;
    // Only perform JS syntax quick-parse checks — other languages will not parse in new Function
    if (lang !== 'javascript') {
      setLiveError(null);
      setLiveLine(null);
      return;
    }
    const id = setTimeout(() => {
      try {
        // quick parse check without executing user code
        // new Function will throw on syntax errors
        // eslint-disable-next-line no-new-func
        new Function(editorCode || '');
        setLiveError(null);
        setLiveLine(null);
      } catch (e: any) {
        const friendly = friendlyErrorMessage(e);
        setLiveError(friendly);
        // try to parse line number from stack if available
        const stack = e?.stack || '';
        const m = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/:(\d+):(\d+)/);
        if (m && m[1]) setLiveLine(Number(m[1]));
      }
    }, 400);
    return () => clearTimeout(id);
  }, [editorCode, lessonStage, lang]);

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 opacity-95 transform-gpu" />
        <svg className="pointer-events-none absolute left-0 top-8 opacity-30" width="600" height="200" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 150 C150 20, 450 20, 590 150" stroke="#ffbf00" strokeWidth="3" strokeOpacity="0.12" strokeLinecap="round" />
          <path d="M10 160 C150 30, 450 30, 590 160" stroke="#ffbf00" strokeWidth="1" strokeOpacity="0.06" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-white drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]">Interactive Learning Paths — Step-by-step Lessons with Live Tests & Feedback</h1>

      {/* Continue / Summary */}
      <Card className="p-4 bg-slate-900/70 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Your progress</div>
            <div className="text-xs text-gray-400">Progress is saved on this device. Pro tracks unlock with Pro.</div>
          </div>
          {resume ? (
            <Button
              onClick={() => {
                const list = resume.level === 'basic' ? basic : resume.level === 'medium' ? medium : advanced;
                const item = list[resume.index];
                if (!item) {
                  toast({ title: 'Nothing to resume', description: 'Your saved activity was not found.' });
                  return;
                }
                const locked = resume.level !== 'basic' && !user?.isPro;
                handleClick(item, locked, resume.level, resume.index);
              }}
              className="bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              Continue: {resume.title ? resume.title.replace(/^\d+\.\s*/, '') : resume.level}
            </Button>
          ) : (
            <div className="text-sm text-gray-300">Start any activity to enable Continue.</div>
          )}
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {([
            { level: 'basic' as const, label: 'Basic', items: basic },
            { level: 'medium' as const, label: 'Medium', items: medium },
            { level: 'advanced' as const, label: 'Advanced', items: advanced },
          ]).map((t) => {
            const p = progressFor(t.level, t.items.length);
            const locked = t.level !== 'basic' && !user?.isPro;
            return (
              <div key={t.level} className="p-3 rounded border border-white/10 bg-black/20">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white font-semibold">{t.label}{locked ? ' 🔒' : ''}</div>
                  <div className="text-xs text-gray-400">{p.unlocked}/{p.total}</div>
                </div>
                <div className="mt-2 w-full h-2 bg-white/10 rounded overflow-hidden">
                  <div className="h-2 bg-amber-400" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Weekly Challenges */}
      <Card className="p-4 bg-slate-900/70 border border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Weekly Challenges</div>
            <div className="text-xs text-gray-400">One easy, medium and hard challenge each week. Complete to earn XP/FlowCoins and rank on the leaderboard.</div>
          </div>
          <div className="text-xs text-gray-400">Week: {weekKey}</div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {([
            { difficulty: 'easy' as const, label: 'Easy', reward: weeklyChallenges.easy.xpReward },
            { difficulty: 'medium' as const, label: 'Medium', reward: weeklyChallenges.medium.xpReward },
            { difficulty: 'hard' as const, label: 'Hard', reward: weeklyChallenges.hard.xpReward },
          ]).map((c) => {
            const completed = hasCompletedWeekly(c.difficulty);
            const disabled = lang !== 'javascript';
            const top = getWeeklyLeaderboard(c.difficulty)[0];
            return (
              <div key={c.difficulty} className={`p-3 rounded border ${completed ? 'border-emerald-400/25 bg-emerald-400/10' : 'border-white/10 bg-black/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white font-semibold">{c.label}</div>
                  <div className={`text-xs ${completed ? 'text-emerald-200' : 'text-gray-400'}`}>{completed ? '✓ Completed' : 'New'}</div>
                </div>
                <div className="mt-1 text-xs text-gray-400">Reward: {c.reward} XP (+{Math.floor(c.reward / 5)} coins)</div>
                {top ? (
                  <div className="mt-2 text-[11px] text-gray-400">Leaderboard #1: {top.name} • {top.seconds}s</div>
                ) : (
                  <div className="mt-2 text-[11px] text-gray-400">Leaderboard: no entries yet</div>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    disabled={disabled}
                    className={disabled ? '' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'}
                    variant={disabled ? 'outline' : 'default'}
                    onClick={() => openWeeklyChallenge(c.difficulty)}
                  >
                    {disabled ? 'JS only' : completed ? 'Open' : 'Start'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {lang !== 'javascript' && (
          <div className="mt-3 text-xs text-gray-400">Note: automated weekly challenge validation currently runs only for JavaScript.</div>
        )}
      </Card>

      {/* Badges & Certificates */}
      <Card className="p-4 bg-slate-900/70 border border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Badges & Certificates</div>
            <div className="text-xs text-gray-400">Earn a badge per track. Export a certificate when all tracks are completed.</div>
          </div>
          <div className="text-xs text-gray-400">Language: {String(lang).toUpperCase()}</div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {([
            { level: 'basic' as const, label: 'Basic Badge' },
            { level: 'medium' as const, label: 'Medium Badge' },
            { level: 'advanced' as const, label: 'Advanced Badge' },
          ]).map((b) => {
            const earned = isCapstoneDone(b.level);
            return (
              <div key={b.level} className={`p-3 rounded border ${earned ? 'border-emerald-400/25 bg-emerald-400/10' : 'border-white/10 bg-black/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white font-semibold">{b.label}</div>
                  <div className={`text-xs ${earned ? 'text-emerald-200' : 'text-gray-400'}`}>{earned ? '✓ Earned' : 'Locked'}</div>
                </div>
                <div className="mt-2 text-xs text-gray-400">Complete the {b.level} capstone to earn.</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-sm text-white font-semibold">Certificate</div>
            <div className="text-xs text-gray-400">
              {isCertificateEligible ? '✓ Eligible — you completed Basic, Medium and Advanced.' : 'Complete all three tracks to unlock.'}
            </div>
          </div>
          <Button
            onClick={() => setOpenCertificate(true)}
            disabled={!isCertificateEligible}
            className={!isCertificateEligible ? '' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'}
            variant={!isCertificateEligible ? 'outline' : 'default'}
          >
            {isCertificateEligible ? 'Open certificate' : 'Locked'}
          </Button>
        </div>
      </Card>

      {/* Profession Paths */}
      <Card className="p-4 bg-slate-900/70 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-white font-semibold">Learning Paths by profession</div>
            <div className="text-xs text-gray-400">Choose a structured path, then start with the first in-app activity.</div>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {professionPaths.map((p) => (
            <div key={p.id} className="p-3 rounded border border-white/10 bg-black/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white font-semibold">{p.title}</div>
                  <div className="mt-1 text-xs text-gray-400">{p.steps.join(' → ')}</div>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                  onClick={() => startProfessionPath(p.id)}
                >
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      

      <div className="space-y-6">
        {[{ title: 'Basic', items: basic, locked: false }, { title: 'Medium', items: medium, locked: !user?.isPro }, { title: 'Advanced', items: advanced, locked: !user?.isPro }].map((track, ti) => {
          const isProTrack = track.title !== 'Basic';
          const trackDesc = track.title === 'Basic'
            ? 'Foundations — Learn the building blocks: variables, expressions, control flow and simple functions.\n\nVariables are like labeled containers: they hold values you can reuse, change, and move around. Think of a variable as a box with a name on it.\n\nFunctions are recipes: they take inputs (ingredients), run steps, and produce results.\n\nArrays are ordered lists (like a row of boxes) and objects are named containers (like a labeled toolbox). These analogies help beginners reason about code structure and behavior.'
            : track.title === 'Medium'
              ? 'Intermediate — Connect pieces together: async patterns, modular code, APIs and testing.\n\nClosures let inner functions remember their environment (like a chef keeping secret spices in a locked drawer).\n\nAsync/await and Promises help you work with time-based tasks (like ordering food and waiting for delivery).\n\nModules let you split code into reusable parts; testing ensures each part behaves as expected.'
              : 'Advanced — Build real apps: architecture, performance, TypeScript, tooling and scaling.\n\nLearn how components interact at scale, measure and improve performance, use TypeScript to catch bugs earlier, and apply design patterns and tooling for maintainable systems.';
          return (
          <div key={track.title} className="rounded-lg border border-amber-400/12 bg-gradient-to-br from-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isProTrack ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900' : 'bg-gradient-to-br from-amber-400 to-rose-400 text-slate-900'}`}>
                  {isProTrack ? <div className="text-2xl">👑</div> : <div className="text-slate-900 font-bold">{track.title}</div>}
                </div>
                <div>
                  <div className={`text-lg font-semibold ${isProTrack ? 'text-amber-300' : 'text-white'}`}>{track.title} Track {isProTrack ? '👑' : ''}</div>
                  <div className="text-xs text-gray-300">{trackDesc}</div>
                </div>
              </div>
              <div className="text-sm text-gray-300">{track.items.length} activities</div>
            </div>

            <div className="flex items-start gap-6">
              {/* Left: vertical progress path */}
              <div className="hidden md:flex flex-col items-center gap-2 w-28">
                <div className="w-12 h-12 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center font-bold">3</div>
                <div className="flex-1 w-1 bg-white/6 rounded" />
                <div className={`w-12 h-12 rounded-full ${track.locked ? 'bg-slate-800 text-gray-400' : 'bg-amber-400 text-slate-900'} flex items-center justify-center font-semibold`}>{track.locked ? '🔒' : '★'}</div>
                <div className="flex-1 w-1 bg-white/6 rounded" />
                <div className="w-12 h-12 rounded-full bg-slate-800 text-gray-400 flex items-center justify-center">⚑</div>
              </div>

              {/* Center: items grid (tile-style activity tiles) */}
              <div className="flex-1">
                {track.items.length === 0 ? (
                  <div className="p-4">
                    <Card className="p-4 bg-slate-800/60 border-white/5">
                      <div className="text-sm font-semibold text-amber-300">This language doesn't use this track format</div>
                      <div className="mt-2 text-sm text-gray-300">Try switching the programming language selector or check the Exercises page for language-specific content.</div>
                    </Card>
                  </div>
                ) : (
                <TrackPath
                  items={track.items}
                  disabledAll={track.locked}
                  unlockedIndex={Number(localStorage.getItem(`unlocked-${lang}-${track.title.toLowerCase()}`) || '0')}
                  onSelect={(it, disabled, idx) => handleClick(it, disabled, track.title.toLowerCase(), idx)}
                  columns={5}
                />
                )}

                {(() => {
                  const level = track.title.toLowerCase() as 'basic' | 'medium' | 'advanced';
                  const unlocked = Number(localStorage.getItem(`unlocked-${lang}-${level}`) || '0');
                  const doneAll = track.items.length > 0 && unlocked >= track.items.length;
                  const locked = track.locked || !doneAll;
                  const completed = isCapstoneDone(level);

                  return (
                    <Card className="mt-4 p-4 bg-slate-900/60 border-white/5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">Capstone Project</div>
                          <div className="text-xs text-gray-400">
                            {completed
                              ? '✓ Completed'
                              : locked
                                ? 'Complete all activities to unlock'
                                : 'A final mini project with automated tests'}
                          </div>
                        </div>
                        <Button
                          onClick={() => openCapstoneFor(level)}
                          disabled={locked}
                          className={locked ? '' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'}
                          variant={locked ? 'outline' : 'default'}
                        >
                          {locked ? 'Locked' : completed ? 'Open' : 'Start'}
                        </Button>
                      </div>
                      {!track.locked && doneAll && lang !== 'javascript' && (
                        <div className="mt-3 text-xs text-gray-400">
                          Note: automated validation currently runs only for JavaScript.
                        </div>
                      )}
                    </Card>
                  );
                })()}
              </div>

              {/* Right: small details */}
              <div className="hidden lg:block w-44">
                <Card className="p-3 bg-slate-900/60 border-white/5">
                  <div className="text-xs text-gray-300 mb-2">Track progress</div>
                  <div className="w-full h-3 bg-white/6 rounded overflow-hidden">
                    {(() => {
                      const level = track.title.toLowerCase() as 'basic' | 'medium' | 'advanced';
                      const p = progressFor(level, track.items.length);
                      return <div className="h-full bg-amber-400" style={{ width: `${p.pct}%` }} />;
                    })()}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">Earn badges for streaks and completions. Medium/Advanced require Pro.</div>
                </Card>

                {/* Certificate modal */}
                {openCertificate && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/20 rounded p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold text-white">Certificate of Completion</h4>
                          <p className="text-sm text-gray-300">{String(lang).toUpperCase()} Learning Path — Basic, Medium, Advanced</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setOpenCertificate(false)}>Close</Button>
                        </div>
                      </div>

                      <Card className="mt-4 p-4 bg-black/20 border-white/10">
                        <div className="text-xs text-gray-400">Awarded to</div>
                        <div className="text-xl font-semibold text-white">{learnerName}</div>
                        <div className="mt-2 text-sm text-gray-300">Issued: {certificateIssuedAt ? new Date(certificateIssuedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}</div>
                      </Card>

                      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="text-xs text-gray-400">Share on LinkedIn / GitHub by copying text/snippet.</div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const date = certificateIssuedAt ? new Date(certificateIssuedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                              const text = `I just completed the CodeFlow ${String(lang).toUpperCase()} Learning Path (Basic, Medium, Advanced) — ${date}.`;
                              copyToClipboard(text, 'LinkedIn text copied');
                            }}
                          >
                            Copy LinkedIn text
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const date = certificateIssuedAt ? new Date(certificateIssuedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                              const md = `**CodeFlow Certificate — ${String(lang).toUpperCase()} Learning Path**\n\n- Completed: Basic, Medium, Advanced\n- Issued: ${date}`;
                              copyToClipboard(md, 'GitHub snippet copied');
                            }}
                          >
                            Copy GitHub snippet
                          </Button>
                          <Button
                            className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                            onClick={() => {
                              downloadCertificateHtml();
                              toast({ title: 'Certificate downloaded' });
                            }}
                          >
                            Download HTML
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded" />
          </div>
        )})}
      </div>

      {/* Capstone modal */}
      {openCapstone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/20 rounded p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-white">{openCapstone.title}</h4>
                <p className="text-sm text-gray-300 mb-2">{openCapstone.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpenCapstone(null)}>Close</Button>
              </div>
            </div>

            <div className="mt-4">
              {capstoneStage === 'overview' && (
                <div>
                  <div className="text-sm text-gray-300">Requirements</div>
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-200 space-y-1">
                    {openCapstone.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setCapstoneStage('work')}>Start</Button>
                    <Button variant="outline" onClick={() => setOpenCapstone(null)}>Close</Button>
                  </div>
                </div>
              )}

              {capstoneStage === 'work' && (
                <div>
                  <div className="text-sm text-gray-300">Editor</div>
                  <textarea
                    value={capstoneCode}
                    onChange={(e) => setCapstoneCode(e.target.value)}
                    className="w-full h-72 p-3 leading-6 text-base font-mono bg-slate-900 text-gray-100 rounded mt-2 border border-white/10"
                  />

                  <div className="mt-3 flex gap-2">
                    <Button onClick={runCapstone} disabled={capstoneRunning}>
                      {capstoneRunning ? 'Running tests...' : 'Run tests'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCapstoneCode(openCapstone.starterCode);
                        setCapstoneMsg(null);
                      }}
                    >
                      Reset
                    </Button>
                    <Button variant="outline" onClick={() => setCapstoneStage('overview')}>Back</Button>
                  </div>
                </div>
              )}

              {capstoneStage === 'result' && (
                <div>
                  <div className="text-sm text-gray-300">Result</div>
                  <div className="mt-2 text-sm text-gray-200">{capstoneMsg}</div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setCapstoneStage('work')}>Try Again</Button>
                    <Button variant="outline" onClick={() => setOpenCapstone(null)}>Close</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weekly challenge modal */}
      {openWeekly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/20 rounded p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-white">{openWeekly.title}</h4>
                <p className="text-sm text-gray-300 mb-2">{openWeekly.description}</p>
                <div className="text-xs text-gray-400">Reward: {openWeekly.xpReward} XP (+{Math.floor(openWeekly.xpReward / 5)} coins) • Week: {weekKey}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpenWeekly(null)}>Close</Button>
              </div>
            </div>

            {weeklyStage === 'overview' && (
              <div className="mt-4">
                <Card className="p-4 bg-black/20 border-white/10">
                  <div className="text-sm text-white font-semibold">How it works</div>
                  <div className="mt-2 text-sm text-gray-300">Write a JavaScript function named <span className="font-mono">{openWeekly.functionName}</span>. Click Run to execute tests.</div>
                  <div className="mt-3 flex justify-end">
                    <Button className="bg-amber-500 text-slate-900 hover:bg-amber-400" onClick={() => setWeeklyStage('work')}>Start</Button>
                  </div>
                </Card>
              </div>
            )}

            {weeklyStage !== 'overview' && (
              <div className="mt-4 grid gap-3">
                <Card className="p-3 bg-black/20 border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Editor</div>
                  <textarea
                    value={weeklyCode}
                    onChange={(e) => setWeeklyCode(e.target.value)}
                    className="w-full h-56 rounded bg-slate-950/60 border border-white/10 text-gray-200 font-mono text-xs p-2"
                  />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-400">Time: {weeklyStartTs ? `${Math.max(0, Math.round((Date.now() - weeklyStartTs) / 1000))}s` : '—'}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setWeeklyStage('overview'); setWeeklyMsg(null); }}>Back</Button>
                      <Button
                        onClick={runWeeklyChallenge}
                        disabled={weeklyRunning}
                        className={weeklyRunning ? '' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'}
                        variant={weeklyRunning ? 'outline' : 'default'}
                      >
                        {weeklyRunning ? 'Running…' : 'Run tests'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-black/20 border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Tests</div>
                  <div className="grid gap-1">
                    {openWeekly.tests.map((t) => (
                      <div key={t.name} className="text-xs text-gray-300">• {t.name}</div>
                    ))}
                  </div>
                  {weeklyMsg && (
                    <div className="mt-3 text-sm text-gray-200">{weeklyMsg}</div>
                  )}
                </Card>

                <Card className="p-3 bg-black/20 border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Leaderboard (Top 10)</div>
                  {weeklyLeaderboard.length === 0 ? (
                    <div className="text-sm text-gray-400">No entries yet.</div>
                  ) : (
                    <div className="space-y-1">
                      {weeklyLeaderboard.map((r, idx) => (
                        <div key={r.userId} className="text-xs text-gray-200 flex items-center justify-between">
                          <div>#{idx + 1} {r.name}</div>
                          <div className="text-gray-400">{r.seconds}s</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal / drawer for item preview */}
      {openItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/20 rounded p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-white">{openItem.title}</h4>
                <p className="text-sm text-gray-300 mb-2">{openItem.summary}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpenItem(null)}>Close</Button>
              </div>
            </div>

            {/* Lesson flow: overview -> step-by-step -> run/feedback */}
            <div className="mt-4">
              {lessonStage === 'overview' && (
                <div>
                  <div className="text-sm text-gray-300">Overview</div>
                  <div className="mt-2 prose text-sm text-gray-200">{openItem.summary}</div>
                  {(() => {
                    try {
                      const [lvl, idn] = openItem.id.split('-');
                      const idxNum = Number(idn) - 1;
                      const titleOnly = openItem.title.replace(/^[0-9]+\.\s*/, '');
                      const minutes = estimateMinutesForTopic(titleOnly);

                      const list = lvl === 'basic' ? basic : lvl === 'medium' ? medium : advanced;
                      const prevTitle = idxNum > 0 ? list?.[idxNum - 1]?.title?.replace(/^[0-9]+\.\s*/, '') : null;
                      const prereq = idxNum > 0 ? `Complete: ${idxNum}. ${prevTitle || 'previous activity'}` : null;

                      return (
                        <div className="mt-4 grid md:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-xs uppercase tracking-wider text-gray-400">Estimated time</div>
                            <div className="mt-1 text-sm text-white font-semibold">~{minutes} min</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-xs uppercase tracking-wider text-gray-400">Prerequisites</div>
                            <div className="mt-1 text-sm text-gray-200">{prereq || 'None'}</div>
                          </div>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                  {/* Use lesson spec to render teaching for any topic */}
                  {(() => {
                    try {
                      const idxNum = Number(openItem.id.split('-')[1]) - 1;
                      const titleOnly = openItem.title.replace(/^[0-9]+\.\s*/, '');
                      const spec = getLessonSpec(titleOnly, openItem.sampleCode, idxNum);
                      return spec?.teaching || null;
                    } catch (e) {
                      return null;
                    }
                  })()}
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setLessonStage('step')}>Start Lesson</Button>
                    <Button variant="outline" onClick={() => setOpenItem(null)}>Close</Button>
                  </div>
                </div>
              )}

              {lessonStage === 'step' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-300">Step-by-step</div>
                    <ol className="mt-2 list-decimal list-inside text-sm text-gray-200 space-y-2">
                      <li>Read the instruction and modify the code on the right.</li>
                      <li>Use the sample code as a starting point.</li>
                      <li>Click <strong>Run</strong> to validate this step.</li>
                      <li>If incorrect, read the feedback and try again.</li>
                    </ol>
                    <div className="mt-4">
                      <div className="text-sm text-gray-300">Feedback</div>
                      <div className="mt-2 text-sm text-yellow-200">{resultMsg || 'No feedback yet — run your code.'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-300">Editor</div>
                      <textarea ref={editorRef} value={editorCode} onChange={(e) => setEditorCode(e.target.value)} className={`w-full h-56 p-3 leading-6 text-base font-mono bg-slate-900 text-gray-100 rounded mt-2 ${liveError ? 'border-2 border-red-600' : 'border border-white/10'}`} />
                    {liveError && (
                      <div className="mt-2 p-2 bg-red-900/60 border border-red-700 text-sm text-red-100 rounded">
                        <div className="font-semibold">Live check failed:</div>
                        <div>{liveError}</div>
                        {liveLine && <div className="text-xs text-red-200">Possible line: {liveLine}</div>}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {lang !== 'javascript' && (
                        <div className="w-full mb-2 p-2 rounded bg-blue-900/40 text-sm text-blue-100">Run is available for JavaScript exercises only. For Python and Java tracks, please follow the examples and try locally.</div>
                      )}
                      <Button onClick={async () => {
                        setRunning(true); setResultMsg(null); setLiveLine(null);
                        try {
                          if (lang !== 'javascript') {
                            setResultMsg('Execution is supported only for JavaScript in this demo.');
                            return;
                          }
                          const fnMatch = editorCode.match(/function\s+(\w+)\s*\(/);
                          if (!fnMatch) {
                            setResultMsg('No function found. Make sure you define a function to run.');
                            return;
                          }
                          const fn = fnMatch[1];
                          const res = await runInWorker(editorCode, fn, [], {
                            timeoutMs: 5000,
                            onStep: (line) => {
                              try {
                                setLiveLine(line);
                                setPreviewPlaying(true);
                                if (editorRef.current) {
                                  const approxLineHeight = 18;
                                  editorRef.current.scrollTop = Math.max(0, (line - 3) * approxLineHeight);
                                }
                              } catch {}
                            },
                            onSnapshot: (vars) => {
                              try { setCurrentVars(vars); } catch {}
                            }
                          });
                          setPreviewPlaying(false);
                          // Use lesson spec validator when available
                          try {
                            const idxNum = openItem ? Number(openItem.id.split('-')[1]) - 1 : 0;
                            const titleOnly = openItem ? openItem.title.replace(/^[0-9]+\.\s*/, '') : '';
                            const spec = getLessonSpec(titleOnly, openItem?.sampleCode || editorCode, idxNum);
                            const check = spec?.validate ? spec.validate(res) : { ok: true, message: JSON.stringify(res) };
                            if (check?.ok) {
                              setResultMsg('✅ Correct — ' + (check.message || 'Validation passed.'));
                              setLessonStage('result');
                              toast({ title: 'Success', description: 'Step validated.' });
                              try {
                                if (openItem) {
                                  const [lvl, idn] = openItem.id.split('-');
                                  const curIdx = Number(idn) - 1;
                                  const key = `unlocked-${lang}-${lvl}`;
                                  const cur = Number(localStorage.getItem(key) || '0');
                                  localStorage.setItem(`completed-${openItem.id}-${lang}`, '1');
                                  if (curIdx === cur) {
                                    localStorage.setItem(key, String(cur + 1));
                                    toast({ title: 'Unlocked', description: 'Next activity unlocked.' });
                                  }
                                }
                              } catch (e) {
                                // ignore storage errors
                              }
                            } else {
                              setResultMsg('❌ ' + (check?.message || 'Validation failed.'));
                            }
                          } catch (e) {
                            setResultMsg('✅ Code ran successfully. Result: ' + JSON.stringify(res));
                            setLessonStage('result');
                          }
                        } catch (err: any) {
                          const friendly = friendlyErrorMessage(err);
                          setResultMsg('❌ Error: ' + friendly + '\nTip: check the function name and syntax.');
                          setLiveError(friendly);
                        } finally { setRunning(false); }
                      }} disabled={running || lang !== 'javascript'}>{running ? 'Running...' : 'Run'}</Button>
                      <Button variant="ghost" onClick={() => { setEditorCode(openItem.sampleCode); setResultMsg(null); setLiveError(null); }}>Reset</Button>
                    </div>
                    {currentVars && (
                      <div className="mt-3 p-3 bg-slate-800/60 border border-white/5 rounded text-sm text-gray-200">
                        <div className="font-semibold text-amber-300">Current Variables</div>
                        <div className="mt-2">
                          {Object.keys(currentVars).length === 0 ? (
                            <div className="text-xs text-gray-400">(no tracked variables)</div>
                          ) : (
                            Object.entries(currentVars).map(([k,v]) => (
                              <div key={k} className="flex justify-between text-xs py-0.5"><div className="text-gray-300">{k}</div><div className="text-amber-200">{JSON.stringify(v)}</div></div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lessonStage === 'result' && (
                <div>
                  <div className="text-sm text-gray-300">Result</div>
                  <div className="mt-2 text-sm text-gray-200">{resultMsg}</div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => { setLessonStage('step'); setResultMsg(null); }}>Try Again</Button>
                    <Button variant="outline" onClick={() => setOpenItem(null)}>Close</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
