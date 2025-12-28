import { useState, useEffect, useMemo, useRef } from "react";
import { runInWorker, createWorkerController } from "@/lib/sandbox";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { lineNumbers, highlightActiveLineGutter } from '@codemirror/gutter';
import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { exercises, type Exercise, type Language } from "@/lib/exercises-new";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, CheckCircle2, Lightbulb, Play, RotateCcw, Eye, ChevronRight, HelpCircle, SkipForward } from "lucide-react";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { StackFrame, HeapObject } from "@/lib/types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { AdVideoPlayer } from '@/components/ad-video-player';
import { LanguageBadge } from '@/components/language-selector';
import { useIsMobile } from "@/hooks/use-mobile";
// import removed: useLanguage
import { useUser } from "@/hooks/use-user";
import { checkAndConsumeExecution, grantExecutions } from "@/lib/execution-limit";

interface TestResult {
  name: string;
  passed: boolean;
  result?: any;
  expected?: any;
  error?: string | null;
}

interface ExecutionState {
  isExecuting: boolean;
  currentLineIndex: number;
  errorMessage: string | null;
  stack: StackFrame[];
  heap: HeapObject[];
  logs: string[];
}

export function ExercisesViewNew() {
  const t: any = {};
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useUser();
  
  // Debug log removed for stability
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const { progLang, setProgLang } = useLanguage();
  const selectedLanguage: Language = (progLang as Language) || "javascript";
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; type?: 'hint' | 'solution'; price?: number }>(() => ({ open: false }));
  // sidebar hover preview removed — roadmap is a sub-tab opened by button
  const lang = (progLang || 'javascript') as string;

  type Activity = { id: string; title: string; sampleCode: string };
  function makeTrackActivities(level: 'basic' | 'medium' | 'advanced'): Activity[] {
    const items: Activity[] = [];
    for (let i = 1; i <= 15; i++) {
      const title = `${i}. ${level === 'basic' ? 'Fundamentals' : level === 'medium' ? 'Patterns' : 'Advanced'} ${i}`;
      let sampleCode = '';
      if (lang === 'python') sampleCode = `# ${title}\ndef example_${i}():\n    print(${i})`;
      else if (lang === 'java') sampleCode = `// ${title}\npublic class Example${i} { public static void main(String[] args){ System.out.println(${i}); } }`;
      else sampleCode = `// ${title}\nfunction example${i}(){ console.log(${i}); }`;
      items.push({ id: `${level}-${i}`, title, sampleCode });
    }
    return items;
  }

  const basicActivities = useMemo<Activity[]>(() => makeTrackActivities('basic'), [lang]);
  const mediumActivities = useMemo<Activity[]>(() => makeTrackActivities('medium'), [lang]);
  const advancedActivities = useMemo<Activity[]>(() => makeTrackActivities('advanced'), [lang]);

  // Listen for roadmap deep-link open events and localStorage fallback
  useEffect(() => {
    const tryOpen = (payload: any) => {
      if (!payload) return;
      try {
        const { title, sampleCode, level, index } = payload;
        // Create a synthetic exercise object so editor opens with the sample
        const fakeId = `track-${level}-${(index || 0) + 1}`;
        const fakeExercise: Exercise = {
          id: fakeId,
          title: title || `Track Exercise ${(index || 0) + 1}`,
          description: `From ${level} track - ${title || ''}`,
          difficulty: 'Beginner',
          variants: {
            javascript: { language: 'javascript', initialCode: sampleCode || '', solution: '', hint: '' }
          },
          tests: [],
        } as Exercise;

        setSelectedExercise(fakeExercise);
        setCode(sampleCode || '');
        // remove localStorage so it doesn't reopen repeatedly
        try { localStorage.removeItem('openTrackItem'); } catch {}
      } catch (e) {
        // ignore
      }
    };

    const handler = (e: any) => {
      const payload = e?.detail || null;
      tryOpen(payload);
    };

    window.addEventListener('openTrackItem', handler as EventListener);

    // check localStorage on mount
    try {
      const raw = localStorage.getItem('openTrackItem');
      if (raw) {
        const parsed = JSON.parse(raw);
        tryOpen(parsed);
      }
    } catch (e) {
      // ignore
    }

    return () => window.removeEventListener('openTrackItem', handler as EventListener);
  }, []);

  // preview effect removed
  const [serverPurchases, setServerPurchases] = useState<string[]>([]);
  const [showAdPromo, setShowAdPromo] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    currentLineIndex: -1,
    errorMessage: null,
    stack: [],
    heap: [],
    logs: [],
  });

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const cmViewRef = useRef<any>(null);
  const [currentVars, setCurrentVars] = useState<Record<string, any> | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean; type?: 'hint' | 'solution' }>({ open: false });
  const controllerRef = useRef<any>(null);
  const pendingStepResolveRef = useRef<((line:number)=>void) | null>(null);

  const currentVariant = selectedExercise.variants[selectedLanguage] || selectedExercise.variants['javascript'];

  // Helper: explain common errors with friendly tips
  const explainError = (err: any) => {
    if (!err) return 'Unknown error';
    const msg = err.message || String(err);
    if (/SyntaxError/.test(msg)) return msg + ' — Syntax error: check missing parentheses, commas or braces.';
    if (/ReferenceError/.test(msg)) return msg + ' — Reference error: check variable and function names.';
    if (/TypeError/.test(msg)) return msg + ' — Type error: check operations on wrong types.';
    return msg;
  };

  const sampleExercises = useMemo(() => {
    const arr = [...exercises];
    // simple Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 20);
  }, []);

  // Load initial code when exercise or language changes
  useEffect(() => {
    if (currentVariant) {
      const savedCode = localStorage.getItem(`exercise-${selectedExercise.id}-${selectedLanguage}`);
      setCode(savedCode || currentVariant.initialCode);
    }
    setTestResults([]);
    setShowSolution(false);
    setShowHint(false);
    resetExecution();
  }, [selectedExercise.id, selectedLanguage]);

  // selectedLanguage is derived from global selector (progLang)

  // Save code to localStorage
  useEffect(() => {
    if (code) {
      localStorage.setItem(`exercise-${selectedExercise.id}-${selectedLanguage}`, code);
    }
  }, [code, selectedExercise.id, selectedLanguage]);

  const resetExecution = () => {
    setExecutionState({
      isExecuting: false,
      currentLineIndex: -1,
      errorMessage: null,
      stack: [],
      heap: [],
      logs: [],
    });
  };

  const runTests = async () => {
    if (!code.trim()) {
      toast({ title: `❌ $Error`, description: "Write Code First", variant: "destructive" });
      return;
    }

    const allowance = checkAndConsumeExecution(user?.id, !!user?.isPro, 5);
    if (!allowance.allowed) {
      // Show ad promo to grant extra executions instead of immediate error
      setShowAdPromo(true);
      setExecutionState(prev => ({ ...prev, isExecuting: false }));
      return;
    }

    resetExecution();
    setExecutionState(prev => ({ ...prev, isExecuting: true }));

    try {
      // Extract function name
      const functionMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionMatch) {
        setTestResults([{ name: "Error", passed: false, error: "No Function Found" }]);
        setExecutionState(prev => ({ ...prev, isExecuting: false }));
        return;
      }

      const functionName = functionMatch[1];
      
      // Run tests in sandboxed worker
      const results: TestResult[] = [];
      const jsTimeoutMs = user?.isPro ? 6000 : 3000;
      for (const test of selectedExercise.tests) {
        try {
          // run with step callback to update executionState.currentLineIndex
          const result = await runInWorker(code, functionName, test.input, {
            timeoutMs: jsTimeoutMs,
            onStep: (line) => {
              try {
                setExecutionState(prev => ({ ...prev, currentLineIndex: Math.max(0, line - 1), logs: [...prev.logs, `▶ line ${line}`] }));
                if (editorRef.current) {
                  const approxLineHeight = 18;
                  editorRef.current.scrollTop = Math.max(0, (line - 3) * approxLineHeight);
                }
              } catch {}
            },
            onSnapshot: (snapshot) => { try { const vars = snapshot?.vars || {}; const stack = snapshot?.stack || []; const heap = snapshot?.heap || []; setCurrentVars(vars); setExecutionState(prev => ({ ...prev, stack, heap })); } catch {} }
          });
          const passed = JSON.stringify(result) === JSON.stringify(test.expected);
          if (!passed) {
            const explanation = `Expected: ${JSON.stringify(test.expected)}, Received: ${JSON.stringify(result)}`;
            results.push({ name: test.name, passed, result, expected: test.expected, error: explanation });
          } else {
            results.push({ name: test.name, passed, result, expected: test.expected, error: null });
          }
        } catch (e: any) {
          const expl = explainError(e);
          results.push({ name: test.name, passed: false, error: expl });
        }
      }

      setTestResults(results);
      
      // Create visual feedback
      const allPassed = results.every(r => r.passed);
      const stackFrame: StackFrame = {
        id: 'test-frame',
        name: functionName,
        active: true,
        variables: [
          { name: 'testes', value: `${results.filter(r => r.passed).length}/${results.length}`, type: 'primitive', changed: true }
        ],
      };

      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        stack: [stackFrame],
        logs: results.map(r => r.passed ? `✅ ${r.name}` : `❌ ${r.name}: ${r.error || "Received"}`),
      }));

      if (allPassed) {
        toast({ title: "🎉 " + "All Tests Passed", description: "All Tests Passed", variant: "default" });
        // auto-advance after small delay
        setTimeout(() => handleNextExercise(), 800);
      }
    } catch (e) {
      setTestResults([{ name: "Error", passed: false, error: (e as any).message }]);
      setExecutionState(prev => ({ ...prev, isExecuting: false, errorMessage: (e as any).message }));
    }
  };

  const createController = () => {
    // terminate existing
    try { controllerRef.current?.terminate(); } catch {}
    const functionMatch = code.match(/function\s+(\w+)\s*\(/);
    if (!functionMatch) {
      toast({ title: 'No function found', description: 'Please define a function to step through.', variant: 'destructive' });
      return null;
    }
    const functionName = functionMatch[1];
    const snapshotHistory: Array<{ line:number; vars: Record<string, any>; stack?: any[]; heap?: any[] }> = [];
    const ctrl = createWorkerController(code, functionName, [], {
      onStep: (line:number) => {
        try {
          setExecutionState(prev => ({ ...prev, currentLineIndex: Math.max(0, line - 1), logs: [...prev.logs, `▶ line ${line}`] }));
          // highlight line in CodeMirror if available
          try {
            const view = cmViewRef.current;
            if (view && typeof line === 'number' && line > 0) {
              const docLine = view.state.doc.line(line);
              view.dispatch({ selection: EditorSelection.range(docLine.from, docLine.from) });
              view.focus();
            }
          } catch {}
          if (pendingStepResolveRef.current) {
            pendingStepResolveRef.current(line);
            pendingStepResolveRef.current = null;
          }
        } catch {}
      },
      onSnapshot: (snapshot, line) => { try { const vars = snapshot?.vars || {}; const stack = snapshot?.stack || []; const heap = snapshot?.heap || []; setCurrentVars(vars); setExecutionState(prev => ({ ...prev, stack, heap })); snapshotHistory.push({ line: Number(line)||0, vars: { ...vars }, stack, heap }); } catch {} }
    });
    // attach history and helper to controller
    (ctrl as any).snapshotHistory = snapshotHistory;
    (ctrl as any).goTo = (index: number) => {
      const h = snapshotHistory[index];
      if (h) {
        setExecutionState(prev => ({ ...prev, currentLineIndex: Math.max(0, h.line - 1) }));
        try { setCurrentVars(h.vars || {}); } catch {}
        try {
          const view = cmViewRef.current;
          if (view && h.line > 0) {
            const docLine = view.state.doc.line(h.line);
            view.dispatch({ selection: EditorSelection.range(docLine.from, docLine.from) });
            view.focus();
          }
        } catch {}
      }
    };
    controllerRef.current = ctrl;
    return ctrl;
  };

  const stepForward = async () => {
    if (!controllerRef.current) {
      const c = createController();
      if (!c) return;
    }
    const p = new Promise<number>((res) => { pendingStepResolveRef.current = res; });
    try { controllerRef.current.step(); } catch (e) { pendingStepResolveRef.current = null; return; }
    try {
      const line = await p;
      return line;
    } catch { return; }
  };

  const stepBack = async () => {
    const current = executionState.currentLineIndex;
    if (current <= 0) return;
    const ctrl = controllerRef.current;
    if (ctrl && (ctrl as any).snapshotHistory) {
      const hist = (ctrl as any).snapshotHistory as Array<any>;
      const targetIndex = Math.max(0, hist.length - 1 - 1); // go to previous snapshot
      // simpler: find last snapshot with line < current+1
      let idx = -1;
      for (let i = hist.length - 1; i >= 0; i--) {
        if (hist[i].line < current + 1) { idx = i; break; }
      }
      if (idx >= 0) {
        (ctrl as any).goTo(idx);
      }
      return;
    }
    // fallback: replay
    const targetLine = Math.max(0, current - 1);
    try { controllerRef.current?.terminate(); } catch {}
    const c = createController();
    if (!c) return;
    for (let i = 0; i <= targetLine; i++) {
      // eslint-disable-next-line no-await-in-loop
      await stepForward();
    }
  };

  const hasPurchased = (exerciseId: string, type: 'hint' | 'solution') => {
    return serverPurchases.includes(`${exerciseId}:${type}`);
  };

  const openPurchase = (type: 'hint' | 'solution') => {
    const price = type === 'hint' ? 5 : 10;
    setPurchaseDialog({ open: true, type, price });
  };

  const confirmPurchase = () => {
    if (!purchaseDialog.type) return;
    const key = `${selectedExercise.id}:${purchaseDialog.type}`;
    setServerPurchases(prev => Array.from(new Set([...prev, key])));
    setPurchaseDialog({ open: false });
    try { toast({ title: 'Purchase simulated', description: 'Item unlocked' }); } catch {}
  };

  const handleNextExercise = () => {
    const currentIndex = exercises.indexOf(selectedExercise);
    if (currentIndex < exercises.length - 1) {
      setSelectedExercise(exercises[currentIndex + 1]);
      resetExecution();
      setTestResults([]);
    }
  };

  const handleAdComplete = () => {
    grantExecutions(user?.id, 5);
    setShowAdPromo(false);
    try { toast({ title: '✅ Promo complete', description: 'You earned +5 free uses' }); } catch {}
  };

  const handleAdClose = () => setShowAdPromo(false);

  const renderContent = () => {
    return (
      <ResizablePanelGroup direction="horizontal">
        {/* Left panel: Description + Editor */}
        <ResizablePanel defaultSize={55} minSize={25}>
          <ResizablePanelGroup direction="vertical">
            {/* Exercise Description */}
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="h-full p-4 overflow-y-auto">
                <Card className="p-4 bg-card/50 border-white/10 h-full">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-50">{selectedExercise.title}</h3>
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                      {selectedExercise.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{selectedExercise.description}</p>
              
                  <div className="flex gap-2">
                    {currentVariant?.hint && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (user?.isPro || hasPurchased(selectedExercise.id, 'hint')) {
                            setShowHint((s) => {
                              const next = !s;
                              if (next) setShowSolution(false);
                              return next;
                            });
                            return;
                          }
                          openPurchase('hint');
                        }}
                        className="gap-2"
                      >
                        <Lightbulb className="w-4 h-4" /> Hint {user?.isPro || hasPurchased(selectedExercise.id, 'hint') ? '' : `(Buy 5¢)`}
                      </Button>
                    )}
                    {currentVariant?.solution && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            if (user?.isPro || hasPurchased(selectedExercise.id, 'solution')) {
                            setShowSolution((s) => {
                              const next = !s;
                              if (next) setShowHint(false);
                              return next;
                            });
                            return;
                          }
                          openPurchase('solution');
                        }}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" /> View Solution {user?.isPro || hasPurchased(selectedExercise.id, 'solution') ? '' : `(Buy 10¢)`}
                      </Button>
                    )}
                  </div>

                  {!user?.isPro && (
                    <p className="text-xs text-amber-200 mt-2">Pro Exclusive: upgrade to unlock hints and full solutions.</p>
                  )}

                  <AnimatePresence>
                      {showHint && currentVariant?.hint && (user?.isPro || hasPurchased(selectedExercise.id, 'hint')) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded"
                      >
                        <p className="text-sm text-yellow-200">💡 {currentVariant.hint}</p>
                      </motion.div>
                    )}
                      {showSolution && currentVariant?.solution && (user?.isPro || hasPurchased(selectedExercise.id, 'solution')) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded"
                      >
                        <pre className="text-xs overflow-x-auto">
                          <code className="text-green-200">{currentVariant.solution}</code>
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/10 hover:bg-primary/50 transition-colors" />

            {/* Code Editor */}
            <ResizablePanel defaultSize={75} minSize={25}>
              <div className="h-full p-4 flex flex-col">
                <Card className="flex-1 flex flex-col p-4 bg-card/50 border-white/10">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-50">
                    <ChevronRight className="w-3 h-3" /> Editor
                  </h4>
                  <textarea
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full p-4 leading-7 text-base font-mono bg-[#0d1220] text-slate-50 rounded border border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="// Write your code here..."
                    spellCheck="false"
                  />
                  
                  {executionState.errorMessage && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-xs text-red-300">❌ {executionState.errorMessage}</p>
                    </div>
                  )}
                </Card>
                {currentVars && (
                  <div className="mt-3 p-3 bg-slate-800/60 border border-white/5 rounded text-sm text-gray-200">
                    <div className="font-semibold text-amber-300">Current Variables</div>
                    <div className="mt-2">
                      {Object.keys(currentVars).length === 0 ? (
                        <div className="text-sm text-gray-400">(no tracked variables)</div>
                      ) : (
                        Object.entries(currentVars).map(([k,v]) => (
                          <div key={k} className="flex justify-between text-sm py-1"><div className="text-gray-300">{k}</div><div className="text-amber-200">{JSON.stringify(v)}</div></div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5" />

        {/* Painel Direito: Stack, Heap, Resultados */}
        <ResizablePanel defaultSize={45} minSize={25}>
          <ResizablePanelGroup direction="vertical">
            {/* Stack */}
            <ResizablePanel defaultSize={35} minSize={10}>
              <div className="h-full p-4 bg-[#0d1220]/50 border-b border-white/5 overflow-auto">
                <h4 className="text-sm font-semibold mb-3 text-slate-200">📚 Variables</h4>
                {executionState.stack.length > 0 ? (
                  <CallStack stack={executionState.stack} />
                ) : (
                  <p className="text-xs text-muted-foreground">Execute to See Steps</p>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5" />

            {/* Heap */}
            <ResizablePanel defaultSize={30} minSize={10}>
              <div className="h-full p-4 bg-[#0d1220]/50 border-b border-white/5 overflow-auto">
                <h4 className="text-sm font-semibold mb-3 text-slate-200">💾 Memory</h4>
                {executionState.heap.length > 0 ? (
                  <HeapMemory heap={executionState.heap} />
                ) : (
                  <p className="text-xs text-muted-foreground">Execute to See Steps</p>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5" />

            {/* Resultados */}
            <ResizablePanel defaultSize={35} minSize={10}>
              <div className="h-full p-4 bg-[#0d1220]/50 overflow-auto">
                <h4 className="text-sm font-semibold mb-3 text-slate-200">📊 Tests</h4>
                {testResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Run to See Results</p>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((result, idx) => {
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded border ${
                            result.passed
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          }`}
                        >
                          <div className="flex gap-2 items-start">
                            {currentVariant?.hint && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (user?.isPro || hasPurchased(selectedExercise.id, 'hint')) {
                                    setViewModal({ open: true, type: 'hint' });
                                  } else {
                                    openPurchase('hint');
                                  }
                                }}
                                className="gap-2"
                              >
                                <Lightbulb className="w-4 h-4" /> Hint
                              </Button>
                            )}

                            {currentVariant?.solution && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (user?.isPro || hasPurchased(selectedExercise.id, 'solution')) {
                                    setViewModal({ open: true, type: 'solution' });
                                  } else {
                                    openPurchase('solution');
                                  }
                                }}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" /> View Solution
                              </Button>
                            )}

                            <motion.div className="p-4 bg-primary/20 border border-primary rounded text-sm">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                <div className="flex-1">
                                  <p className="font-bold text-primary">🎉 All Tests Passed!</p>
                                  <p className="text-sm text-muted-foreground">All Tests Passed</p>
                                </div>
                                <Button size="sm" onClick={handleNextExercise} className="gap-2">
                                  Next Exercise <SkipForward className="w-3 h-3" />
                                </Button>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] min-h-[720px] flex flex-col pb-24">
      {/* Toolbar */}
      <div className="h-auto md:h-16 border-b border-white/10 bg-card/30 flex items-center px-4 py-3 justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg">{selectedExercise.title}</h2>
          <div className="ml-2">
            <span className="px-2 py-1 bg-slate-800/40 rounded text-xs">{selectedLanguage}</span>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Button size="sm" variant={/*@ts-ignore*/ 'ghost'} onClick={() => {}} className="px-3">Lesson</Button>
            <Button size="sm" variant="outline" onClick={() => {}} className="px-3">Playground</Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={resetExecution}
            variant="ghost"
            size="icon"
            title="Clear"
            className="h-8 w-8"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => { stepBack(); }}
            variant="ghost"
            size="icon"
            title="Step Back"
            className="h-8 w-8 hidden md:inline-flex"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>

          <Button
            onClick={runTests}
            disabled={executionState.isExecuting}
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4" />
            {executionState.isExecuting ? "Executing" : "Run"}
          </Button>

          <Button
            onClick={() => { stepForward(); }}
            variant="ghost"
            size="icon"
            title="Step Forward"
            className="h-8 w-8 hidden md:inline-flex"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="w-36 ml-2 hidden md:block">
            <Slider 
              value={[3000 - executionSpeed]} 
              min={100} 
              max={2900} 
              step={100} 
              onValueChange={(v) => setExecutionSpeed(3000 - v[0])} 
              title="Execution speed"
            />
          </div>
        </div>
      </div>

      {/* Main Content: sandbox editor + visualizer (full width) */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Left: Editor and Explanation */}
          <div className="w-2/3 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">script.js</div>
                <div className="text-xs text-muted-foreground">Step {executionState.currentLineIndex > 0 ? executionState.currentLineIndex : '-'}</div>
              </div>
            </div>

            <Card className="p-6 bg-[#0b1220]/70 border border-white/5 mb-4 min-h-[360px]">
              <div className="w-full h-[360px]">
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[javascript(), lineNumbers(), highlightActiveLineGutter(), EditorView.lineWrapping]}
                  onChange={(value) => setCode(value)}
                  onCreateEditor={(view) => { cmViewRef.current = view; }}
                  className="rounded"
                />
              </div>
            </Card>

            <Card className="p-4 bg-card/40 border-white/5">
              <h4 className="text-sm font-semibold text-slate-200">Explanation</h4>
              <p className="mt-2 text-sm text-gray-300">{selectedExercise.description}</p>
            </Card>
          </div>

          {/* Right: Call Stack / Heap / Tests */}
          <div className="w-1/3 p-6 space-y-4">
            <div className="p-4 bg-[#0d1220]/60 border border-white/5 rounded min-h-[140px]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-200">CALL STACK (PILHA)</h4>
                <div className="text-xs text-muted-foreground">ACTIVE</div>
              </div>
              <div className="text-sm text-slate-100">
                {executionState.stack.length > 0 ? (
                  <CallStack stack={executionState.stack} />
                ) : (
                  <p className="text-sm text-gray-400">Execute to See Steps</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#0d1220]/60 border border-white/5 rounded min-h-[140px]">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">HEAP MEMORY (OBJECTS)</h4>
              {executionState.heap.length > 0 ? (
                <HeapMemory heap={executionState.heap} />
              ) : (
                <p className="text-sm text-gray-400">Heap memory empty</p>
              )}
            </div>

            <div className="p-4 bg-[#0d1220]/60 border border-white/5 rounded min-h-[160px] overflow-auto">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">TESTS</h4>
              {testResults.length === 0 ? (
                <p className="text-sm text-gray-400">Run to See Results</p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((r, i) => (
                    <div key={i} className={`p-3 rounded ${r.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">{r.name}</div>
                        <div className="text-sm text-amber-200">{r.passed ? 'Passed' : 'Failed'}</div>
                      </div>
                      {r.error && <div className="mt-2 text-xs text-red-300">{r.error}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="h-1 bg-white/5 w-full shrink-0">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ 
            width: testResults.length > 0
              ? `${(testResults.filter(r => r.passed).length / testResults.length) * 100}%`
              : 0
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {showAdPromo && (
        <AdVideoPlayer onAdComplete={handleAdComplete} onClose={handleAdClose} />
      )}
      {/* Hint / Solution Viewer */}
      {viewModal.open && (
        <Dialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewModal.type === 'hint' ? 'Hint' : 'Solution'}</DialogTitle>
              <DialogDescription>{viewModal.type === 'hint' ? 'A helpful hint to guide you.' : 'Full solution for the exercise.'}</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              {viewModal.type === 'hint' ? (
                currentVariant?.hint ? (
                  <p className="text-sm text-yellow-200">{currentVariant.hint}</p>
                ) : (
                  <p className="text-sm text-gray-400">No hint available for this exercise.</p>
                )
              ) : (
                currentVariant?.solution ? (
                  <pre className="text-sm overflow-x-auto"><code className="text-green-200">{currentVariant.solution}</code></pre>
                ) : (
                  <p className="text-sm text-gray-400">No solution available for this exercise.</p>
                )
              )}

              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" onClick={() => setViewModal({ open: false })}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Purchase Dialog (simulated checkout) */}
      {purchaseDialog.open && (
        <Dialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase {purchaseDialog.type}</DialogTitle>
              <DialogDescription>Buy this item to unlock the {purchaseDialog.type} for this exercise.</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <p className="mb-3">Price: <strong>{purchaseDialog.price}¢</strong></p>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setPurchaseDialog({ open: false })}>Cancel</Button>
                <Button onClick={confirmPurchase}>Buy</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Divider above footer */}
      <div className="border-t border-white/10 w-full" />
    </div>
  );
}
