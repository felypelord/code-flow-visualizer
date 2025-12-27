import { useState, useEffect, useMemo } from "react";
import { runInWorker } from "@/lib/sandbox";
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
          const result = await runInWorker(code, functionName, test.input, { timeoutMs: jsTimeoutMs });
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
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full p-3 font-mono text-sm bg-[#0d1220] text-slate-50 rounded border border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="// Write your code here..."
                    spellCheck="false"
                  />
                  
                  {executionState.errorMessage && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-xs text-red-300">❌ {executionState.errorMessage}</p>
                    </div>
                  )}
                </Card>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">📚 Variables</h4>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">💾 Memory</h4>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-3">📊 Tests</h4>
                {testResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Run to See Results</p>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded border ${
                          result.passed
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        <div className="flex gap-2">
                        {currentVariant?.hint && (user?.isPro || hasPurchased(selectedExercise.id, 'hint')) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setShowHint((s) => {
                                const next = !s;
                                if (next) setShowSolution(false);
                                return next;
                              });
                            }}
                            className="gap-2"
                          >
                            <Lightbulb className="w-4 h-4" /> Hint
                          </Button>
                        )}
                        {currentVariant?.solution && (user?.isPro || hasPurchased(selectedExercise.id, 'solution')) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setShowSolution((s) => {
                                const next = !s;
                                if (next) setShowHint(false);
                                return next;
                              });
                            }}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" /> View Solution
                          </Button>
                        )}
                      </div>
                        className="p-4 bg-primary/20 border border-primary rounded"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                          <div className="flex-1">
                            <p className="font-bold text-primary">🎉 All Tests Passed!</p>
                            <p className="text-xs text-muted-foreground">All Tests Passed</p>
                          </div>
                          <Button size="sm" onClick={handleNextExercise} className="gap-2">
                            Next Exercise <SkipForward className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
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
      <div className="h-auto md:h-16 border-b border-white/10 bg-card/30 flex flex-col md:flex-row items-center px-4 py-2 md:py-0 justify-between shrink-0 gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full md:w-auto">
          <h2 className="font-bold text-lg whitespace-nowrap hidden md:block">Exercises</h2>
          
          {/* Exercise Selector */}
          <Select
            value={selectedExercise.id}
            onValueChange={(id) => {
              const exercise = exercises.find(e => e.id === id);
              if (exercise) setSelectedExercise(exercise);
            }}
          >
            <SelectTrigger className="w-[200px] h-8 bg-white/5 border-white/10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Indicador de Linguagem (apenas display) */}
          <div className="hidden md:block">
            <LanguageBadge />
          </div>
          
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
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
            onClick={runTests}
            disabled={executionState.isExecuting}
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4" />
            {executionState.isExecuting ? "Executing" : "Test Code"}
          </Button>

          <div className="w-24 ml-2 hidden md:block">
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

      {/* Main Content: Left tiles (20 random exercises) + Right sandbox editor */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: tiles */}
          <div className="w-full md:w-1/2 lg:w-1/3 p-6 overflow-auto border-r border-white/5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">Exercises</h3>
              <p className="text-sm text-gray-300">20 randomized activities — from simple to complex. Click one to open the sandbox on the right.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sampleExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setSelectedExercise(ex);
                    const v = ex.variants[selectedLanguage] || ex.variants.javascript;
                    setCode(v?.initialCode || '');
                    resetExecution();
                    setTestResults([]);
                    
                  }}
                  className="p-3 text-left rounded bg-slate-800/40 hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{ex.title}</div>
                    <div className="text-xs text-gray-300">{ex.difficulty}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{ex.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: sandbox editor + visualizer */}
          <div className="flex-1 p-4 overflow-auto">
            {renderContent()}
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
