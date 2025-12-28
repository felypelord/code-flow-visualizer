import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Play } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/contexts/LanguageContext';
import { runInWorker } from '@/lib/sandbox';
import { useToast } from '@/hooks/use-toast';

type TrackItem = { id: string; title: string; summary: string; sampleCode: string };

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

export default function LearningTrack() {
  const { user } = useUser();
  const { progLang } = useLanguage();
  const lang = (progLang || 'javascript') as string;
  const basic = useMemo(() => makeItems('basic', lang), [lang]);
  const medium = useMemo(() => makeItems('medium', lang), [lang]);
  const advanced = useMemo(() => makeItems('advanced', lang), [lang]);

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
                      <div className="mt-2 text-sm text-gray-300">Esta linguagem não utiliza este formato de trilha. Try switching the programming language selector or check the Exercises page for language-specific content.</div>
                    </Card>
                  </div>
                ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {track.items.map((it, idx) => {
                    const unlockedIndex = Number(localStorage.getItem(`unlocked-${lang}-${track.title.toLowerCase()}`) || '0');
                    const seqLocked = idx > unlockedIndex; // locked until previous completed
                    const disabled = track.locked || seqLocked;
                    return (
                      <button key={it.id} onClick={() => handleClick(it, disabled, track.title.toLowerCase(), idx)} disabled={disabled} className={`p-3 rounded-lg text-left shadow-md transform transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${track.locked ? 'bg-slate-800/60' : 'bg-slate-800/40'}`}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white">{idx + 1}</div>
                          <div className="text-xs text-gray-300">{track.locked ? '🔒' : seqLocked ? '🔒' : '▶'}</div>
                        </div>
                        <div className="mt-2 text-sm text-gray-200 font-medium">{it.title.replace(/^[0-9]+\.\s*/, '')}</div>
                        <div className="mt-1 text-xs text-gray-400">{it.summary}</div>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>

              {/* Right: small details */}
              <div className="hidden lg:block w-44">
                <Card className="p-3 bg-slate-900/60 border-white/5">
                  <div className="text-xs text-gray-300 mb-2">Track progress</div>
                  <div className="w-full h-3 bg-white/6 rounded overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: '20%' }} />
                  </div>
                  <div className="mt-3 text-xs text-gray-400">Earn badges for streaks and completions. Medium/Advanced require Pro.</div>
                </Card>
              </div>
            </div>

            <div className="mt-4 h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded" />
          </div>
        )})}
      </div>

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
