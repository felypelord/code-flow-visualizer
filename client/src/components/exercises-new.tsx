// Clean single-version Exercises view (Lesson UI copy)
import { useState, useEffect, useMemo, useRef } from "react";
// Layout is provided by the page; avoid double-wrapping to prevent duplicated header/footer
import CodeEditor from "@/components/code-editor";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { exercises as exercisesList } from '@/lib/exercises-new';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronRight } from "lucide-react";
import { createWorkerController, runInWorker } from '@/lib/sandbox';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from '@/hooks/use-toast';
import { useUser } from "@/hooks/use-user";
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageBadge } from '@/components/language-selector';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

type Activity = { id: string; title: string; sampleCode: string; description?: string };

// Use the canonical exercise definitions from the library so UI and runner match
function makeTrackActivities(_level: 'basic' | 'medium' | 'advanced', lang: string): Activity[] {
  return exercisesList
    .filter(e => {
      if (_level === 'basic') return e.difficulty === 'Beginner';
      if (_level === 'medium') return e.difficulty === 'Intermediate';
      return e.difficulty === 'Advanced';
    })
    .map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      sampleCode: (e.variants as any)[lang]?.initialCode || e.variants.javascript?.initialCode || ''
    }));
}

export function ExercisesViewNew() {
  const isMobile = useIsMobile();
  const { user } = useUser();
  const { progLang } = useLanguage();
  const lang = (progLang || 'javascript') as string;
  const { toast } = useToast();

  const basicActivities = useMemo(() => makeTrackActivities('basic', lang), [lang]);
  const mediumActivities = useMemo(() => makeTrackActivities('medium', lang), [lang]);
  const advancedActivities = useMemo(() => makeTrackActivities('advanced', lang), [lang]);

  const allActivities = [...basicActivities, ...mediumActivities, ...advancedActivities];
  const [selectedActivityId, setSelectedActivityId] = useState<string>(allActivities[0]?.id || '');
  const selectedActivity = allActivities.find(a => a.id === selectedActivityId) || allActivities[0];

  // Use Lesson UI with single-step variant derived from activity
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);

  const variant = {
    code: selectedActivity?.sampleCode || '',
    steps: [ { line: 1, explanation: selectedActivity?.description || selectedActivity?.title || '', stack: [], heap: [] } ]
  } as any;

  const [code, setCode] = useState<string>(variant.code || '');
  const execControllerRef = useRef<any>(null);
  const execIntervalRef = useRef<number | null>(null);
  const execTimeoutRef = useRef<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execPaused, setExecPaused] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<{ stack: any[]; heap: any[]; vars?: Record<string, any> }>({ stack: [], heap: [] });
  const [activeLine, setActiveLine] = useState<number | undefined>(undefined);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ ok: boolean; message?: string; failedTest?: string; expected?: any; actual?: any; errorLine?: number | null } | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showNextPulse, setShowNextPulse] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  useEffect(() => {
    if (execError) {
      try {
        toast({ title: 'Execution error', description: execError, variant: 'destructive' });
      } catch (e) {
        console.warn('Toast failed', e);
      }
    }
  }, [execError]);

  useEffect(() => {
    if (validationResult && validationResult.ok) {
      try {
        toast({ title: 'All tests passed', description: validationResult.message || 'Well done!', variant: 'default' });
      } catch (e) {}
      setShowSuccessBanner(true);
      // show confetti briefly, pulse Next button, and auto-hide banner after 6s
      if (user?.particleEffects) {
        try { setShowConfetti(true); } catch(e){}
      }
      try { setShowNextPulse(true); } catch(e){}
      const tPulse = setTimeout(() => { try { setShowNextPulse(false); } catch(e){} }, 2000);
      const t1 = setTimeout(() => { try { setShowConfetti(false); } catch(e){} }, 2500);
      const t2 = setTimeout(() => { try { setShowSuccessBanner(false); } catch(e){} }, 6000);
      return () => { clearTimeout(tPulse); clearTimeout(t1); clearTimeout(t2); };
    }
  }, [validationResult, user?.particleEffects]);

  useEffect(() => {
    if (validationResult && validationResult.ok === false) {
      setShowErrorBanner(true);
      // highlight the failing line if available
      try { setActiveLine(validationResult.errorLine ?? undefined); } catch(e){}
      const t = setTimeout(() => { try { setShowErrorBanner(false); } catch(e){} }, 8000);
      return () => clearTimeout(t);
    }
  }, [validationResult]);

  const currentStep = variant.steps[currentStepIndex] || variant.steps[0];
  const totalSteps = variant.steps.length || 1;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, totalSteps, speed]);

  useEffect(() => {
    setCode(variant.code || '');
  }, [selectedActivityId, lang]);

  // clear previous validation when code or selected activity changes
  useEffect(() => {
    setValidationResult(null);
    setShowSuccessBanner(false);
    setShowErrorBanner(false);
    setActiveLine(undefined);
  }, [code, selectedActivityId]);

  const startExecution = async () => {
    console.log('startExecution called', { selectedActivityId, codeLength: code?.length, isExecuting, execPaused });
    setExecError(null);
    if (isExecuting) { console.debug('startExecution aborted: already executing'); return; }
    let codeToRun = code && code.length ? code : (selectedActivity?.sampleCode || '');
    if (!codeToRun) {
      const msg = 'No code available to execute for selected activity';
      console.warn(msg, selectedActivityId);
      setExecError(msg);
      return;
    }
    setExecPaused(false);
    // Quick syntax check before starting worker to surface parse errors early
    try {
      // Use Function constructor to validate syntax without executing
      // Wrap in parentheses to allow function declarations
      // eslint-disable-next-line no-new-func
      new Function(codeToRun);
    } catch (err) {
      const msg = (err && (err as any).message) || String(err);
      console.error('Syntax check failed', msg);
      setExecError('Syntax error: ' + msg);
      return;
    }

    let fnMatch = codeToRun.match(/function\s+(\w+)\s*\(/);
    let functionName = fnMatch ? fnMatch[1] : undefined;
    // If there is no named function, wrap the code in a known function so the worker can call it
      if (!functionName) {
      const wrapper = '__cf_main';
      codeToRun = `function ${wrapper}(){\n${codeToRun}\n}`;
      functionName = wrapper;
      console.log('Wrapped code in function', wrapper);
    }
    try {
      // compute step delay and sensible timeout based on number of lines
      const linesCount = codeToRun.split('\n').length || 1;
      const stepDelay = Math.max(50, 3000 - speed);
      const timeoutMs = Math.max(10000, stepDelay * linesCount * 10);

      setIsExecuting(true);
      setSnapshot({ stack: [], heap: [] });

      // choose sample args from exercise tests when available so stepping shows function execution
      const exDef = exercisesList.find((e:any)=>e.id===selectedActivityId) as any;
      const sampleArgs = (exDef && Array.isArray(exDef.tests) && exDef.tests[0] && Array.isArray(exDef.tests[0].input)) ? exDef.tests[0].input : [2];
      console.log('startExecution using args', sampleArgs);

      if (stepDelay > 0) {
        // Use manual controller and step from main thread so it's reliable and visible
        const controller = createWorkerController(codeToRun, functionName || '', sampleArgs || [], {
          onStep: (line: number) => { try { setActiveLine(line); setCurrentStepIndex(() => Math.max(0, Math.min(totalSteps - 1, line - 1))); } catch {} },
          onSnapshot: (s: any) => {
            try {
              let normStack: any[] = [];
              if (s && Array.isArray(s.stack)) {
                normStack = s.stack.map((f: any) => {
                  const vars = f && Array.isArray(f.variables)
                    ? f.variables
                    : (f && f.variables && typeof f.variables === 'object')
                      ? Object.entries(f.variables).map(([k, v]) => ({ name: k, value: typeof v === 'object' ? JSON.stringify(v) : v, type: v && typeof v === 'object' ? 'reference' : 'primitive', changed: true }))
                      : [];
                  return { id: f.id || String(Math.random()), name: f.name || 'frame', active: !!f.active, variables: vars };
                });
              } else if (s && s.vars && typeof s.vars === 'object') {
                normStack = [
                  {
                    id: 'global',
                    name: 'global',
                    active: true,
                    variables: Object.entries(s.vars).map(([k, v]) => ({
                      name: k,
                      value: typeof v === 'object' ? JSON.stringify(v) : v,
                      type: v && typeof v === 'object' ? 'reference' : 'primitive',
                      changed: true,
                    })),
                  },
                ];
              }
              const normHeap = (s && Array.isArray(s.heap)) ? s.heap.map((h: any, i: number) => {
                const val = h && h.value !== undefined ? h.value : (h && h.ref ? s.vars?.[h.ref] : undefined);
                const properties = (val && typeof val === 'object')
                  ? Object.entries(val).map(([k, v]) => ({ name: k, value: typeof v === 'object' ? JSON.stringify(v) : v, type: v && typeof v === 'object' ? 'reference' : 'primitive' }))
                  : [{ name: 'value', value: typeof val === 'object' ? JSON.stringify(val) : val, type: val && typeof val === 'object' ? 'reference' : 'primitive' }];
                return { id: h.id || ('heap_' + i), className: h.className || (h.ref ? String(h.ref) : 'Object'), properties };
              }) : [];
              setSnapshot({ stack: normStack, heap: normHeap, vars: s?.vars || {} });
            } catch (e) {}
          }
        });

        execControllerRef.current = controller;
        setIsExecuting(true);

        // initial single step then repeat on interval
        try { controller.step(); } catch (e) { console.warn('initial step failed', e); }
        execIntervalRef.current = window.setInterval(() => { if (!execPaused) { try { controller.step(); } catch (e) { console.warn('step error', e); } } }, stepDelay) as unknown as number;

        // setup timeout to abort long runs
        execTimeoutRef.current = window.setTimeout(() => {
          try { controller.terminate(); } catch(e){}
          setExecError('Execution timed out');
          if (execIntervalRef.current) { clearInterval(execIntervalRef.current); execIntervalRef.current = null; }
          execControllerRef.current = null;
          setIsExecuting(false);
        }, timeoutMs) as unknown as number;

        controller.result.then(() => {
          if (execIntervalRef.current) { clearInterval(execIntervalRef.current); execIntervalRef.current = null; }
          if (execTimeoutRef.current) { clearTimeout(execTimeoutRef.current); execTimeoutRef.current = null; }
          execControllerRef.current = null;
          setIsExecuting(false);
        }).catch((err:any) => {
          if (execIntervalRef.current) { clearInterval(execIntervalRef.current); execIntervalRef.current = null; }
          if (execTimeoutRef.current) { clearTimeout(execTimeoutRef.current); execTimeoutRef.current = null; }
          execControllerRef.current = null;
          setIsExecuting(false);
          setExecError((err && err.message) || String(err));
        });

      } else {
        // no stepping requested, run full worker
        const res = await runInWorker(codeToRun, functionName || '', sampleArgs || [], {
          timeoutMs,
          onStep: (line: number) => { try { setActiveLine(line); setCurrentStepIndex(() => Math.max(0, Math.min(totalSteps - 1, line - 1))); } catch {} },
          onSnapshot: (s: any) => {
            try {
              let normStack: any[] = [];
              if (s && Array.isArray(s.stack)) {
                normStack = s.stack.map((f: any) => {
                  const vars = f && Array.isArray(f.variables)
                    ? f.variables
                    : (f && f.variables && typeof f.variables === 'object')
                      ? Object.entries(f.variables).map(([k, v]) => ({ name: k, value: typeof v === 'object' ? JSON.stringify(v) : v, type: v && typeof v === 'object' ? 'reference' : 'primitive', changed: true }))
                      : [];
                  return { id: f.id || String(Math.random()), name: f.name || 'frame', active: !!f.active, variables: vars };
                });
              } else if (s && s.vars && typeof s.vars === 'object') {
                normStack = [
                  {
                    id: 'global',
                    name: 'global',
                    active: true,
                    variables: Object.entries(s.vars).map(([k, v]) => ({
                      name: k,
                      value: typeof v === 'object' ? JSON.stringify(v) : v,
                      type: v && typeof v === 'object' ? 'reference' : 'primitive',
                      changed: true,
                    })),
                  },
                ];
              }
              const normHeap = (s && Array.isArray(s.heap)) ? s.heap.map((h: any, i: number) => {
                const val = h && h.value !== undefined ? h.value : (h && h.ref ? s.vars?.[h.ref] : undefined);
                const properties = (val && typeof val === 'object')
                  ? Object.entries(val).map(([k, v]) => ({ name: k, value: typeof v === 'object' ? JSON.stringify(v) : v, type: v && typeof v === 'object' ? 'reference' : 'primitive' }))
                  : [{ name: 'value', value: typeof val === 'object' ? JSON.stringify(val) : val, type: val && typeof val === 'object' ? 'reference' : 'primitive' }];
                return { id: h.id || ('heap_' + i), className: h.className || (h.ref ? String(h.ref) : 'Object'), properties };
              }) : [];
              setSnapshot({ stack: normStack, heap: normHeap, vars: s?.vars || {} });
            } catch (e) {}
          }
        });

        setIsExecuting(false);
        execControllerRef.current = null;
        execIntervalRef.current = null;
        execTimeoutRef.current = null;
        return res;
      }
    } catch (err: any) {
      console.error('startExecution error', err);
      setIsExecuting(false);
      setExecError((err && err.message) || String(err));
      execControllerRef.current = null;
    }
  };

  const deepEqual = (a: any, b: any) => {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  };

  const validateTests = async () => {
    console.log('validateTests start', { selectedActivityId });
    setValidating(true);
    setValidationResult(null);
    setExecError(null);

    // find the exercise definition to get tests
    const exDef = exercisesList.find((e) => e.id === selectedActivityId) as any;
    if (!exDef || !Array.isArray(exDef.tests) || exDef.tests.length === 0) {
      setValidationResult({ ok: false, message: 'No tests available for this activity' });
      setValidating(false);
      return;
    }

    let codeToRun = code && code.length ? code : (selectedActivity?.sampleCode || '');
    if (!codeToRun) {
      setValidationResult({ ok: false, message: 'No code to run' });
      setValidating(false);
      return;
    }

    // ensure we have a function name
    let fnMatch = codeToRun.match(/function\s+(\w+)\s*\(/);
    let functionName = fnMatch ? fnMatch[1] : undefined;
    if (!functionName) {
      const wrapper = '__cf_main';
      codeToRun = `function ${wrapper}(){\n${codeToRun}\n}`;
      functionName = wrapper;
    }

    for (const t of exDef.tests) {
      let lastLine: number | null = null;
        try {
          const res = await runInWorker(codeToRun, functionName || '', t.input || [], {
          timeoutMs: 5000,
          onStep: (line: number) => { lastLine = line; },
        });

        if (!deepEqual(res, t.expected)) {
          setValidationResult({ ok: false, message: `Test failed: ${t.name}`, failedTest: t.name, expected: t.expected, actual: res, errorLine: lastLine });
          try { setActiveLine(lastLine ?? undefined); } catch(e){}
          setValidating(false);
          return;
        }
      } catch (err: any) {
        const msg = err && err.message ? String(err.message) : String(err);
        console.log('validateTests caught error', { err: msg, lastLine });
        setValidationResult({ ok: false, message: `Runtime error: ${msg}`, failedTest: t.name, expected: t.expected, actual: null, errorLine: lastLine });
        try { setActiveLine(lastLine ?? undefined); } catch(e){}
        // surface exec error so user sees toast details
        try { setExecError(msg); } catch (e) {}
        setValidating(false);
        return;
      }
    }

    setValidationResult({ ok: true, message: 'All tests passed' });
    console.log('validateTests completed: ok');
    setValidating(false);
  };

  const stopExecution = () => {
    try { execControllerRef.current?.terminate(); } catch {}
    if (execIntervalRef.current) { clearInterval(execIntervalRef.current); execIntervalRef.current = null; }
    if (execTimeoutRef.current) { clearTimeout(execTimeoutRef.current); execTimeoutRef.current = null; }
    execControllerRef.current = null;
    setIsExecuting(false);
    setExecPaused(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem(`selectedActivity:${(progLang||'javascript')}`);
    if (saved) setSelectedActivityId(saved);
  }, [progLang]);

  useEffect(() => {
    if (selectedActivityId) localStorage.setItem(`selectedActivity:${(progLang||'javascript')}`, selectedActivityId);
  }, [selectedActivityId, progLang]);

  const handleNext = () => { if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(prev => prev + 1); };
  const handlePrev = () => { if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1); };
  const handleReset = () => { setCurrentStepIndex(0); setIsPlaying(false); };

  // Ensure Reset also stops any running execution controller
  const handleResetWithStop = () => { stopExecution(); setCurrentStepIndex(0); setIsPlaying(false); };

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const renderContent = () => {
    if (isMobile) {
      return (
        <div className="flex flex-col h-full overflow-y-auto pb-20">
            <div className="h-[400px] shrink-0 p-2 relative">
            <CodeEditor code={code} activeLine={activeLine ?? currentStep.line} editable onChange={setCode} errorLine={validationResult?.errorLine ?? null} />
            {/* Start overlay removed to avoid blocking editor input */}
          </div>
          <div className="p-2 shrink-0">
            <div className="bg-card/50 border border-white/10 rounded-lg p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                <ChevronRight className="w-3 h-3" /> Explanation
              </h3>
              <AnimatePresence mode="wait">
                <motion.p key={`${progLang}-${currentStepIndex}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-sm leading-relaxed font-light">
                  {currentStep.explanation}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-2">
            <div className="h-[300px] bg-[#0d1220]/50 border border-white/5 rounded-lg">
              <CallStack stack={snapshot.stack && snapshot.stack.length ? snapshot.stack : currentStep.stack} />
            </div>
            <div className="h-[300px] bg-[#0d1220]/50 border border-white/5 rounded-lg">
              <HeapMemory heap={snapshot.heap && snapshot.heap.length ? snapshot.heap : currentStep.heap} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full p-4 flex flex-col gap-4">
            <CodeEditor code={code} activeLine={activeLine ?? currentStep.line} editable onChange={setCode} errorLine={validationResult?.errorLine ?? null} />
            {/* Start overlay removed to avoid blocking editor input */}
            <div className="bg-card/50 border border-white/10 rounded-lg p-4 flex-1 overflow-auto min-h-[100px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                <ChevronRight className="w-3 h-3" /> Explanation
              </h3>
              <AnimatePresence mode="wait">
                <motion.div key={`${progLang}-${currentStepIndex}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                  {currentStep.explanation ? (
                    <p className="text-lg leading-relaxed font-light">{currentStep.explanation}</p>
                  ) : (
                    <div className="h-6 w-full bg-gray-700 rounded" />
                  )}
                </motion.div>
              </AnimatePresence>
              {/* Debug: show activeLine and snapshot vars while executing */}
              {isExecuting && (
                <div className="mt-3 p-3 bg-white/5 rounded text-xs text-muted-foreground">
                  <div>Active line: {activeLine ?? '—'}</div>
                  <pre className="mt-2 max-h-36 overflow-auto text-[11px]">{JSON.stringify(snapshot.vars || {}, null, 2)}</pre>
                </div>
              )}
                  {validationResult && (
                        <div className={`mt-3 p-3 rounded text-sm ${validationResult.ok ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                          <div className="font-semibold">{validationResult.ok ? 'All tests passed' : validationResult.message}</div>
                          {!validationResult.ok && (
                            <div className="mt-2 flex items-center gap-4">
                              <div className="text-xs">Possible error at line: <span className="font-mono ml-1">{validationResult.errorLine ?? '—'}</span></div>
                              <div>
                                <Button size="sm" variant="ghost" onClick={() => { try { setActiveLine(validationResult.errorLine ?? undefined); const el = document.querySelector('.code-editor'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e){} }}>Go to line</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5" />

        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full p-4 bg-[#0d1220]/50 border-b border-white/5">
                <CallStack stack={snapshot.stack && snapshot.stack.length ? snapshot.stack : currentStep.stack} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-white/5" />
            <ResizablePanel defaultSize={50} minSize={20}>
               <div className="h-full p-4 bg-[#0d1220]/50">
                <HeapMemory heap={snapshot.heap && snapshot.heap.length ? snapshot.heap : currentStep.heap} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  return (
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Success banner shown when validationResult.ok === true */}
        {showSuccessBanner && (
          <div className="w-full bg-emerald-600 text-white px-6 py-3 flex items-center justify-between gap-4 relative overflow-hidden">
            <div>
              <div className="font-bold">Congrats — exercise passed!</div>
              <div className="text-sm opacity-90">{validationResult?.message || 'You passed the tests.'}</div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => { setShowSuccessBanner(false); }} variant="ghost" className="text-white/90">Close</Button>
              <Button onClick={() => {
                // advance to next activity if available
                const idx = allActivities.findIndex(a => a.id === selectedActivityId);
                if (idx >= 0 && idx < allActivities.length - 1) setSelectedActivityId(allActivities[idx + 1].id);
                setShowSuccessBanner(false);
              }} className={"bg-white text-black transform transition-all duration-300 ease-out " + (showNextPulse ? 'scale-105 shadow-2xl' : '')}>Next</Button>
            </div>
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                <style>{`
                  @keyframes cfFall { 0% { transform: translateY(-10%) rotate(0deg); opacity:1 } 100% { transform: translateY(120%) rotate(360deg); opacity:0 } }
                `}</style>
                {['🎉','✨','🎈','🥳','💫','🎊'].map((emoji, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${10 + i*14}%`, top: 0, fontSize: 20 + (i%3)*6, animation: `cfFall ${1.6 + (i%3)*0.4}s linear forwards`, opacity: 0.95 }}>
                    {emoji}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Toolbar: activity selector + controls */}
        <div className="h-auto md:h-16 border-b border-white/10 bg-card/30 flex flex-col md:flex-row items-center px-4 py-2 md:py-0 justify-between shrink-0 gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full md:w-auto">
            <h2 className="font-bold text-lg whitespace-nowrap hidden md:block">Exercises</h2>
            <div className="hidden md:block">
              <LanguageBadge />
            </div>

            <div className="ml-3">
              <Select value={selectedActivityId} onValueChange={(v) => setSelectedActivityId(v)}>
                <SelectTrigger className="bg-white/5 text-sm rounded p-2 w-64">
                  <SelectValue>{allActivities.find(a => a.id === selectedActivityId)?.title}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allActivities.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-muted-foreground whitespace-nowrap">
              Step {currentStepIndex + 1}/{totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-center pb-2 md:pb-0">
            <Button variant="ghost" size="icon" onClick={() => { console.log('Restart clicked'); handleResetWithStop(); }} title="Restart" className="h-8 w-8">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentStepIndex === 0} className="h-8 w-8">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button size="icon" className={isExecuting ? "bg-amber-500 hover:bg-amber-600 h-8 w-8" : "bg-primary hover:bg-primary/90 h-8 w-8"} title={isExecuting ? (execPaused ? "Resume" : "Pause") : "Play"} onClick={() => {
              console.log('Play clicked', { isExecuting, execPaused });
              if (!isExecuting) { startExecution(); return; }
              // toggle pause/resume when already executing
              const newPaused = !execPaused;
              console.log('Toggling paused ->', newPaused);
              setExecPaused(newPaused);
              if (!newPaused && execControllerRef.current?.resume) execControllerRef.current.resume();
            }}>
              {isExecuting && !execPaused ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowSuccessBanner(false); setShowErrorBanner(false); validateTests(); }}
              disabled={validating || isExecuting}
              className={`ml-2 transition-all duration-200 ${validating ? 'opacity-70 cursor-wait' : validationResult ? (validationResult.ok ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white') : ''}`}
            >
              {validating ? 'Checking...' : (validationResult ? (validationResult.ok ? 'Checked ✓' : 'Checked ✕') : 'Check')}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentStepIndex === totalSteps - 1} className="h-8 w-8">
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="w-24 ml-2 hidden md:block">
              <Slider value={[3000 - speed]} min={500} max={2500} step={100} onValueChange={(v) => setSpeed(3000 - v[0])} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        <div className="h-1 bg-white/5 w-full shrink-0 sticky bottom-0">
          <motion.div className="h-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>
  );
}

export default ExercisesViewNew;
