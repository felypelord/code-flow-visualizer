import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, HelpCircle, Lock, Unlock, ChevronRight, Sparkles } from "lucide-react";
// import removed: useLanguage

export interface GuidedStep {
  id: string;
  title: string;
  lesson: string | string[];
  taskPrompt: string;
  check: (codeOrAnswer: string) => { ok: boolean; messages?: string[] };
}

export interface GuidedPathProps {
  id: string;
  title: string;
  steps: GuidedStep[];
  onComplete?: () => void;
}

function usePersistedProgress(key: string, maxSteps: number) {
  const [progress, setProgress] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(key);
      const v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : Math.min(v, maxSteps);
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, String(progress)); } catch {}
  }, [key, progress]);
  return [progress, setProgress] as const;
}

export function GuidedPath({ id, title, steps, onComplete }: GuidedPathProps) {
  const storageKey = `guided:${id}:progress`;
  const [progress, setProgress] = usePersistedProgress(storageKey, steps.length);
  const [open, setOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number>(progress);
  const currentStep = steps[currentIdx];
  const [answer, setAnswer] = useState<string>("");
  const [result, setResult] = useState<{ ok: boolean; messages?: string[] } | null>(null);
  const t: any = {};

  useEffect(() => {
    setCurrentIdx(progress);
  }, [progress]);

  const pct = useMemo(() => Math.round((progress / steps.length) * 100), [progress, steps.length]);

  const startLesson = () => { setOpen(true); setResult(null); };
  const closeLesson = () => setOpen(false);
  const resetProgress = () => { setProgress(0); setCurrentIdx(0); setAnswer(""); setResult(null); };

  const verify = () => {
    if (!currentStep) return;
    const r = currentStep.check(answer);
    setResult(r);
    if (r.ok) {
      const next = Math.min(steps.length, progress + 1);
      setProgress(next);
      setAnswer("");
      setOpen(false);
      if (next >= steps.length) onComplete?.();
    }
  };

  return (
    <Card className="p-4 bg-slate-900/70 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300" />
          {title}
        </div>
          <div className="flex items-center gap-3">
          <span className="text-xs text-amber-200">{pct}%</span>
          <Button size="sm" variant="outline" className="border-amber-300/40 text-amber-100" onClick={resetProgress}>{"Reset" || "Reset"}</Button>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded">
        <div className="h-2 bg-amber-400 rounded" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-2">
        {steps.map((s, idx) => {
          const locked = idx > progress;
          const done = idx < progress;
          const isCurrent = idx === progress;
          return (
            <div key={s.id} className="flex items-center gap-3 bg-black/30 border border-white/10 rounded px-3 py-2">
              <div className="w-5">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : locked ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{idx + 1}. {s.title}</div>
                <div className="text-xs text-gray-400">{typeof s.lesson === "string" ? s.lesson : s.lesson[0]}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="border-amber-300/40 text-amber-100" onClick={() => { setCurrentIdx(idx); startLesson(); }} disabled={locked}>
                  <HelpCircle className="w-3 h-3" /> {"Lesson" || "Lesson"}
                </Button>
                <Button size="sm" onClick={() => { setCurrentIdx(idx); setOpen(true); }} disabled={locked}>
                  {"Practice" || "Practice"} <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border border-amber-400/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{currentStep?.title}</DialogTitle>
            <DialogDescription className="text-amber-100/80">
              {Array.isArray(currentStep?.lesson) ? (
                <ul className="list-disc ml-4 space-y-1">
                  {currentStep!.lesson.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              ) : (
                <span>{currentStep?.lesson}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="text-sm text-gray-200 mb-2">{("Task Label" || "Task") + ": "}{currentStep?.taskPrompt}</div>
            <textarea
              className="w-full h-32 rounded-lg bg-black/40 border border-amber-400/20 text-sm text-white p-3 font-mono"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={"Type Your Solution" || "Type your solution here"}
            />
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={verify} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">{"Verify" || "Verify"}</Button>
              <Button variant="outline" className="border-amber-400/40 text-amber-200" onClick={closeLesson}>{"Close" || "Close"}</Button>
              {result && (
                <span className={"text-sm " + (result.ok ? "text-emerald-300" : "text-red-300")}>{result.ok ? ("Correct" || "Correct!") : ("Try Again" || "Try again")}</span>
              )}
            </div>
            {result?.messages && result.messages.length > 0 && (
              <ul className="mt-2 text-xs text-gray-300 space-y-1">
                {result.messages.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// A ready-to-use sample path for Pro users.
export function SampleGuidedRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "two-sum",
      title: "Algorithms: Two Sum",
      lesson: [
        "Use a map to record indices by value.",
        "Iterate once and check if (target - current) already exists.",
        "Complexity O(n); avoid O(n^2).",
      ],
      taskPrompt: "Implement function twoSum(nums, target) that returns the correct indices.",
      check: (code) => {
        const messages: string[] = [];
        try {
          const fn = new Function(`${code}; return typeof twoSum === 'function' ? twoSum : null;`);
          const twoSum = fn();
          if (!twoSum) return { ok: false, messages: ["Define the function twoSum"] };
          const tests = [
            { nums: [2,7,11,15], target: 9, out: [0,1] },
            { nums: [3,2,4], target: 6, out: [1,2] },
            { nums: [3,3], target: 6, out: [0,1] },
          ];
          for (const t of tests) {
            const res = twoSum([..."Nums"], "Target");
              if (!res || res.length !== 2 || (res[0] !== "Out"[0] || res[1] !== "Out"[1])) {
              messages.push(`Failed for ${JSON.stringify("Nums")} => ${JSON.stringify(res)}`);
              return { ok: false, messages };
            }
          }
          return { ok: true };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "binary-search",
      title: "Algorithms: Binary Search",
      lesson: [
        "Binary Search divides the array in half repeatedly.",
        "Keep low/high pointers and compute mid.",
        "Return index if found or -1 if absent.",
      ],
      taskPrompt: "Implement binarySearch(arr, target) on a sorted array.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof binarySearch === 'function' ? binarySearch : null;`);
          const bs = fn();
          if (!bs) return { ok: false, messages: ["Define the function binarySearch"] };
          const ok = bs([1,3,5,7,9], 7) === 3 && bs([1,3,5,7,9], 2) === -1;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "palindrome",
      title: "Strings: Palindrome",
      lesson: [
        "Normalize string (lowercase, remove non-alphanumerics).",
        "Compare with the reverse.",
      ],
      taskPrompt: "Implement isPalindrome(s) returning boolean.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof isPalindrome === 'function' ? isPalindrome : null;`);
          const isP = fn();
          if (!isP) return { ok: false, messages: ["Define the function isPalindrome"] };
          const ok = isP("A man, a plan, a canal: Panama") === true && isP("race a car") === false;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "debounce",
      title: "Frontend: Debounce",
      lesson: [
        "Debounce delays execution until after a period of inactivity.",
        "Use a persistent timer inside the closure.",
        "Clear the timer on each call before scheduling the next.",
      ],
      taskPrompt: "Implement debounce(fn, wait) that returns a function which batches calls.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof debounce === 'function' ? debounce : null;`);
          const debounce = fn();
          if (!debounce) return { ok: false, messages: ["Define the debounce function"] };
          let calls = 0;
          const wrapped = debounce(() => { calls++; }, 10);
          wrapped(); wrapped(); wrapped();
          return { ok: calls === 0 };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "react-state",
      title: "React: State",
      lesson: "Explain how to use useState to manage local component state.",
      taskPrompt: "Write a snippet using 'useState' and updating state.",
      check: (code) => {
        if (/useState/.test(code) && /=\s*set[A-Z]/.test(code)) {
          return { ok: true };
        }
        return { ok: false, messages: ["Include 'useState' and a state update (setXYZ)"] };
      },
    },
    {
      id: "memoize",
      title: "Performance: Memoization",
      lesson: [
        "Memoize stores results of pure functions.",
        "Use a cache map keyed by argument values.",
      ],
      taskPrompt: "Implement memoize(fn) that returns a cached function.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof memoize === 'function' ? memoize : null;`);
          const memoize = fn();
          if (!memoize) return { ok: false, messages: ["Define the memoize function"] };
          let hits = 0;
          const slow = (n: number) => { hits++; return n * n; };
          const mslow = memoize(slow as any);
          const a = mslow(4);
          const b = mslow(4);
          const c = mslow(5);
          const ok = a === 16 && b === 16 && c === 25 && hits === 2;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "binary-tree-depth",
      title: "Data Structures: Tree Depth",
      lesson: [
        "Define Node with left/right and compute maxDepth.",
        "Use recursion: 1 + max(depth(left), depth(right)).",
      ],
      taskPrompt: "Implement maxDepth(root) returning the maximum depth.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof maxDepth === 'function' ? maxDepth : null;`);
          const maxDepth = fn();
          if (!maxDepth) return { ok: false, messages: ["Define the maxDepth function"] };
          const tree = { val: 1, left: { val: 2, left: { val: 3 } }, right: { val: 4 } } as any;
          const ok = maxDepth(tree) === 3;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
  ];
  return <GuidedPath id="pro-roadmap" title="Pro Guided Roadmap" steps={steps} />;
}

export function AlgorithmsRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "two-sum",
      title: "Algorithms: Two Sum",
      lesson: ["Index map", "Single pass iteration", "O(n) complexity"],
      taskPrompt: "twoSum(nums, target)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof twoSum === 'function' ? twoSum : null;`);
          const twoSum = fn();
          if (!twoSum) return { ok: false, messages: ["Define twoSum"] };
          const tests = [
            { input: [2,7,11,15], target: 9, expected: [0,1] },
            { input: [3,2,4], target: 6, expected: [1,2] },
          ];
          for (const t of tests) {
            const res = twoSum("Input", "Target");
            if (!res || JSON.stringify(res) !== JSON.stringify("Expected")) {
              return { ok: false, messages: [`Failed: ${JSON.stringify("Input")}, $Target => ${JSON.stringify(res)}`] };
            }
          }
          return { ok: true, messages: ["Excellent! Your O(n) solution is perfect."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "binary-search",
      title: "Algorithms: Binary Search",
      lesson: ["low/high/mid", "Divide and conquer", "Array must be sorted"],
      taskPrompt: "binarySearch(arr, target)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof binarySearch === 'function' ? binarySearch : null;`);
          const bs = fn();
          if (!bs) return { ok: false, messages: ["Define binarySearch"] };
          const tests = [
            { arr: [1,3,5,7,9], target: 7, expected: 3 },
            { arr: [1,3,5,7,9], target: 2, expected: -1 },
            { arr: [1,2,3,4,5], target: 1, expected: 0 },
          ];
          for (const t of tests) {
            const res = bs("Arr", "Target");
            if (res !== "Expected") {
              return { ok: false, messages: [`Failed for $Target in ${JSON.stringify("Arr")}: expected $Expected, got ${res}`] };
            }
          }
          return { ok: true, messages: ["Perfect! O(log n) implementation."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "palindrome",
      title: "Strings: Palindrome",
      lesson: ["Normalize string", "Compare with the reverse", "Ignore spaces/punctuation"],
      taskPrompt: "isPalindrome(s)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof isPalindrome === 'function' ? isPalindrome : null;`);
          const isP = fn();
          if (!isP) return { ok: false, messages: ["Define isPalindrome"] };
          const tests = [
            { input: "A man, a plan, a canal: Panama", expected: true },
            { input: "race a car", expected: false },
            { input: "0P", expected: false },
          ];
          for (const t of tests) {
            const res = isP("Input");
            if (res !== "Expected") {
              return { ok: false, messages: [`Failed for "$Input": expected $Expected, got ${res}`] };
            }
          }
          return { ok: true, messages: ["Excellent! Palindrome validation complete."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "merge-sorted",
      title: "Algorithms: Merge Sorted Arrays",
      lesson: ["Two pointers", "Compare elements", "Result array is sorted"],
      taskPrompt: "mergeSorted(arr1, arr2)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof mergeSorted === 'function' ? mergeSorted : null;`);
          const merge = fn();
          if (!merge) return { ok: false, messages: ["Define mergeSorted"] };
          const res = merge([1,3,5], [2,4,6]);
          const ok = JSON.stringify(res) === JSON.stringify([1,2,3,4,5,6]);
          if (!ok) return { ok: false, messages: [`Result: ${JSON.stringify(res)}, expected [1,2,3,4,5,6]`] };
          return { ok: true, messages: ["Great! Arrays merged correctly."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "longest-substring",
      title: "Strings: Longest Substring Without Repetition",
      lesson: ["Janela deslizante", "Hash set para rastrear chars", "Melhor complexidade"],
      taskPrompt: "lengthOfLongestSubstring(s)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof lengthOfLongestSubstring === 'function' ? lengthOfLongestSubstring : null;`);
          const fn2 = fn();
          if (!fn2) return { ok: false, messages: ["Define lengthOfLongestSubstring"] };
          const tests = [
            { input: "abcabcbb", expected: 3 },
            { input: "bbbbb", expected: 1 },
            { input: "pwwkew", expected: 3 },
          ];
          for (const t of tests) {
            const res = fn2("Input");
            if (res !== "Expected") {
              return { ok: false, messages: [`For "$Input": expected $Expected, got ${res}`] };
            }
          }
          return { ok: true, messages: ["Perfect! Optimized sliding-window solution."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
  ];
  return <GuidedPath id="algorithms-roadmap" title="Pro Roadmap: Algorithms" steps={steps} />;
}

export function FrontendRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "debounce",
      title: "Frontend: Debounce",
      lesson: ["Timer persistente", "Limpar antes de agendar", "Closure para manter estado"],
      taskPrompt: "debounce(fn, wait)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof debounce === 'function' ? debounce : null;`);
          const debounce = fn();
          if (!debounce) return { ok: false, messages: ["Define debounce"] };
          let calls = 0;
          const wrapped = debounce(() => { calls++; }, 50);
          wrapped(); wrapped(); wrapped();
          setTimeout(() => {
            if (calls === 1) return { ok: true, messages: ["Excellent! Debounce is working."] };
          }, 100);
          return { ok: true };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "event-delegation",
      title: "Frontend: Event Delegation",
      lesson: ["Listen on the container", "Use event.target to identify", "Avoid multiple listeners"],
      taskPrompt: "Implement event delegation with addEventListener",
      check: (code) => {
        const ok = /addEventListener/.test(code) && /event\.target/.test(code);
        const msgs = ok ? ["Perfect! Event delegation implemented."] : ["Include addEventListener and event.target"];
        return { ok, messages: msgs };
      },
    },
    {
      id: "throttle",
      title: "Frontend: Throttle",
      lesson: ["Limit call frequency", "Track last-execution timestamp", "Always execute on the first call"],
      taskPrompt: "throttle(fn, delay)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof throttle === 'function' ? throttle : null;`);
          const throttle = fn();
          if (!throttle) return { ok: false, messages: ["Define throttle"] };
          let calls = 0;
          const wrapped = throttle(() => { calls++; }, 100);
          wrapped(); wrapped(); wrapped();
          if (calls >= 1) return { ok: true, messages: ["Good! Throttle is reducing calls."] };
          return { ok: false, messages: ["Throttle didn't work as expected"] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "react-effect-cleanup",
      title: "React: useEffect Cleanup",
      lesson: ["Return a cleanup function", "Avoid memory leaks", "Cleanup runs before unmount"],
      taskPrompt: "useEffect(() => { ...; return () => {...} }, [])",
      check: (code) => {
        const hasEffect = /useEffect\s*\(/.test(code);
        const hasCleanup = /return\s*\(\s*\)\s*=>|return\s*function/.test(code);
        if (hasEffect && hasCleanup) {
          return { ok: true, messages: ["Great! Cleanup function implemented correctly."] };
        }
        return { ok: false, messages: ["Include useEffect with a cleanup function"] };
      },
    },
    {
      id: "dom-manipulation",
      title: "DOM: Efficient Manipulation",
      lesson: ["Use innerHTML carefully", "Use DocumentFragment for batch inserts", "Avoid unnecessary reflows"],
      taskPrompt: "Create elements and insert them once into the DOM",
      check: (code) => {
        const hasFragment = /DocumentFragment|createDocumentFragment/.test(code);
        const msgs = hasFragment ? ["Excellent! Using DocumentFragment for efficiency."] : ["Consider using DocumentFragment for multiple insertions"];
        return { ok: hasFragment, messages: msgs };
      },
    },
  ];
  return <GuidedPath id="frontend-roadmap" title="Pro Roadmap: Frontend" steps={steps} />;
}

export function PerformanceRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "memoize",
      title: "Performance: Memoization",
      lesson: ["Cache by arguments", "Pure functions", "Efficient cache key"],
      taskPrompt: "memoize(fn)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof memoize === 'function' ? memoize : null;`);
          const memoize = fn();
          if (!memoize) return { ok: false, messages: ["Define memoize"] };
          let hits = 0;
          const slow = (n: number) => { hits++; return n * n; };
          const mslow = memoize(slow as any);
          mslow(4); mslow(4); mslow(5);
          if (hits === 2) return { ok: true, messages: ["Perfect! Cache working, only 2 executions."] };
          return { ok: false, messages: [`Cache failed: ${hits} executions (expected 2)`] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "lazy-load",
      title: "Performance: Lazy Loading",
      lesson: ["Defer loading", "IntersectionObserver API", "Save initial bandwidth"],
      taskPrompt: "Create an observer for lazy-loading images",
      check: (code) => {
        const hasObserver = /IntersectionObserver|Intersection/.test(code);
        const msgs = hasObserver ? ["Excellent! IntersectionObserver for lazy load."] : ["Consider using IntersectionObserver"];
        return { ok: hasObserver, messages: msgs };
      },
    },
    {
      id: "code-splitting",
      title: "Performance: Code Splitting",
      lesson: ["Import dynamically", "Reduce initial bundle", "React.lazy for routes"],
      taskPrompt: "Implement dynamic import or React.lazy",
      check: (code) => {
        const hasDynamic = /import\(|React\.lazy/.test(code);
        if (hasDynamic) {
          return { ok: true, messages: ["Great! Code splitting configured."] };
        }
        return { ok: false, messages: ["Use import() or React.lazy for code splitting"] };
      },
    },
    {
      id: "virtual-scroll",
      title: "Performance: Virtual Scrolling",
      lesson: ["Render only visible items", "Start/end indices", "Good for large lists"],
      taskPrompt: "Render list with 10k+ items efficiently",
      check: (code) => {
        const hasIndexing = /start|end|offset|visible/.test(code) && /slice|map/.test(code);
        if (hasIndexing) {
          return { ok: true, messages: ["Good! You're rendering selectively."] };
        }
        return { ok: false, messages: ["Use start/end indices to render only visible items"] };
      },
    },
  ];
  return <GuidedPath id="performance-roadmap" title="Pro Roadmap: Performance" steps={steps} />;
}

export function DataStructuresRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "stack",
      title: "Data Structures: Stack",
      lesson: ["push/pop", "LIFO (Last In First Out)", "Array or linked list"],
      taskPrompt: "Stack class with push/pop/peek",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof Stack === 'function' ? Stack : null;`);
          const Stack = fn();
          if (!Stack) return { ok: false, messages: ["Define Stack"] };
          const s = new (Stack as any)();
          s.push(1); s.push(2); const v = s.pop();
          if (v === 2) return { ok: true, messages: ["Perfect! Stack LIFO working correctly."] };
          return { ok: false, messages: ["Stack not working as expected"] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "queue",
      title: "Data Structures: Queue",
      lesson: ["enqueue/dequeue", "FIFO (First In First Out)", "Useful for BFS"],
      taskPrompt: "Queue class with enqueue/dequeue/peek",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof Queue === 'function' ? Queue : null;`);
          const Queue = fn();
          if (!Queue) return { ok: false, messages: ["Define Queue"] };
          const q = new (Queue as any)();
          q.enqueue(1); q.enqueue(2); const v = q.dequeue();
          if (v === 1) return { ok: true, messages: ["Excellent! Queue FIFO implemented."] };
          return { ok: false, messages: ["Queue not working as expected"] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "linked-list",
      title: "Data Structures: Linked List",
      lesson: ["Node with value/next", "Insert/Delete/Traverse", "Better for frequent insertions"],
      taskPrompt: "LinkedList class with append/remove/traverse",
      check: (code) => {
        const hasNode = /Node|node|next/.test(code);
        const hasMethods = /append|remove|traverse/.test(code);
        if (hasNode && hasMethods) {
          return { ok: true, messages: ["Good! Linked List implemented."] };
        }
        return { ok: false, messages: ["Implement Node, append, remove and traverse"] };
      },
    },
    {
      id: "hash-table",
      title: "Data Structures: Hash Table",
      lesson: ["Hash function", "Collision handling", "O(1) average lookup"],
      taskPrompt: "Simple Hash Table with get/set",
      check: (code) => {
        const hasHash = /hash|key|value|put|get/.test(code);
        if (hasHash) {
          return { ok: true, messages: ["Excellent! Basic hash table implemented."] };
        }
        return { ok: false, messages: ["Implement get/set functions with hash"] };
      },
    },
    {
      id: "binary-search-tree",
      title: "Data Structures: Binary Search Tree",
      lesson: ["Node with left/right", "Insert preserves order", "In-order traversal for ordering"],
      taskPrompt: "BST with insert/search/inorder",
      check: (code) => {
        const hasNode = /left|right/.test(code);
        const hasMethods = /insert|search/.test(code);
        if (hasNode && hasMethods) {
          return { ok: true, messages: ["Perfect! BST with basic operations."] };
        }
        return { ok: false, messages: ["Implement BST with insert and search"] };
      },
    },
  ];
  return <GuidedPath id="datastruct-roadmap" title="Pro Roadmap: Data Structures" steps={steps} />;
}
