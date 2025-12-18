import { useState, useEffect } from "react";
import { runInWorker } from "@/lib/sandbox";
import { exercises, type Exercise, type Language } from "@/lib/exercises";
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
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/hooks/use-user";
import { checkAndConsumeExecution } from "@/lib/execution-limit";

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
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useUser();
  
  // Debug log
  useEffect(() => {
    console.log('Current language in exercises:', language);
    console.log('Translation sample (testCode):', t.testCode);
  }, [language, t]);
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    currentLineIndex: -1,
    errorMessage: null,
    stack: [],
    heap: [],
    logs: [],
  });

  const currentVariant = selectedExercise.variants[selectedLanguage];

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
      toast({ title: `❌ ${t.error}`, description: t.writeCodeFirst, variant: "destructive" });
      return;
    }

    const allowance = checkAndConsumeExecution(user?.id, !!user?.isPro, 5);
    if (!allowance.allowed) {
      setTestResults([{ name: t.error, passed: false, error: "Limite de 5 execuções/dia no plano Free. Faça upgrade para Pro." }]);
      setExecutionState(prev => ({ ...prev, isExecuting: false }));
      return;
    }

    resetExecution();
    setExecutionState(prev => ({ ...prev, isExecuting: true }));

    try {
      // Extract function name
      const functionMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionMatch) {
        setTestResults([{ name: t.error, passed: false, error: t.noFunctionFound }]);
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
          results.push({ name: test.name, passed, result, expected: test.expected, error: null });
        } catch (e: any) {
          results.push({ name: test.name, passed: false, error: e?.message || String(e) });
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
        logs: results.map(r => r.passed ? `✅ ${r.name}` : `❌ ${r.name}: ${r.error || t.received}`),
      }));

      if (allPassed) {
        toast({ title: "🎉 " + t.allTestsPassed, description: t.allTestsPassed, variant: "default" });
      }
    } catch (e) {
      setTestResults([{ name: t.error, passed: false, error: (e as any).message }]);
      setExecutionState(prev => ({ ...prev, isExecuting: false, errorMessage: (e as any).message }));
    }
  };

  const handleNextExercise = () => {
    const currentIndex = exercises.indexOf(selectedExercise);
    if (currentIndex < exercises.length - 1) {
      setSelectedExercise(exercises[currentIndex + 1]);
      resetExecution();
      setTestResults([]);
    }
  };

  const renderContent = () => {
    if (isMobile) {
      return (
        <div className="flex flex-col h-full overflow-y-auto pb-20 gap-4 p-4">
          {/* Descrição */}
          <Card className="p-4 bg-card/50 border-white/10">
            <h3 className="text-lg font-bold mb-2">{selectedExercise.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{selectedExercise.description}</p>
            {currentVariant?.hint && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHint(!showHint)}
                className="gap-2"
              >
                <Lightbulb className="w-4 h-4" /> {showHint ? "Ocultar" : "Ver"} Dica
              </Button>
            )}
            {showHint && currentVariant?.hint && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="text-sm text-yellow-200">{currentVariant.hint}</p>
              </div>
            )}
          </Card>

          {/* Editor */}
          <Card className="p-4">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Seu Código
            </h4>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-3 font-mono text-sm bg-slate-900 text-slate-50 rounded border border-white/20 resize-vertical focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Escreva seu código aqui..."
              spellCheck="false"
            />
          </Card>

          {/* Resultados */}
          {testResults.length > 0 && (
            <Card className="p-4">
              <h4 className="text-sm font-bold mb-3">📊 Resultados</h4>
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
                    <div className="flex items-start gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{result.name}</p>
                        {result.error && <p className="text-xs text-red-300 mt-1">{result.error}</p>}
                        {!result.passed && !result.error && (
                          <div className="text-xs mt-1">
                            <p>Esperado: {JSON.stringify(result.expected)}</p>
                            <p>Obtido: {JSON.stringify(result.result)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      );
    }

    return (
      <ResizablePanelGroup direction="horizontal">
        {/* Painel Esquerdo: Descrição + Editor */}
        <ResizablePanel defaultSize={55} minSize={25}>
          <ResizablePanelGroup direction="vertical">
            {/* Descrição do Exercício */}
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
                          if (!user?.isPro) return;
                          setShowHint(!showHint);
                          if (!showHint) setShowSolution(false);
                        }}
                        disabled={!user?.isPro}
                        className="gap-2"
                      >
                        <Lightbulb className="w-4 h-4" /> {t.hint} (Pro)
                      </Button>
                    )}
                    {currentVariant?.solution && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (!user?.isPro) return;
                          setShowSolution(!showSolution);
                          if (!showSolution) setShowHint(false);
                        }}
                        disabled={!user?.isPro}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" /> {t.viewSolution} (Pro)
                      </Button>
                    )}
                  </div>

                  {!user?.isPro && (
                    <p className="text-xs text-amber-200 mt-2">Exclusivo Pro: faça upgrade para desbloquear dicas e soluções completas.</p>
                  )}

                  <AnimatePresence>
                    {showHint && currentVariant?.hint && user?.isPro && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded"
                      >
                        <p className="text-sm text-yellow-200">💡 {currentVariant.hint}</p>
                      </motion.div>
                    )}
                    {showSolution && currentVariant?.solution && user?.isPro && (
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

            {/* Editor de Código */}
            <ResizablePanel defaultSize={75} minSize={25}>
              <div className="h-full p-4 flex flex-col">
                <Card className="flex-1 flex flex-col p-4 bg-card/50 border-white/10">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-50">
                    <ChevronRight className="w-3 h-3" /> {t.editor}
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">📚 {t.variables}</h4>
                {executionState.stack.length > 0 ? (
                  <CallStack stack={executionState.stack} />
                ) : (
                  <p className="text-xs text-muted-foreground">{t.executeToSeeSteps}</p>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5" />

            {/* Heap */}
            <ResizablePanel defaultSize={30} minSize={10}>
              <div className="h-full p-4 bg-[#0d1220]/50 border-b border-white/5 overflow-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">💾 {t.memory}</h4>
                {executionState.heap.length > 0 ? (
                  <HeapMemory heap={executionState.heap} />
                ) : (
                  <p className="text-xs text-muted-foreground">{t.executeToSeeSteps}</p>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5" />

            {/* Resultados */}
            <ResizablePanel defaultSize={35} minSize={10}>
              <div className="h-full p-4 bg-[#0d1220]/50 overflow-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-3">📊 {t.tests}</h4>
                {testResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t.runToSeeResults}</p>
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
                        <div className="flex items-start gap-2">
                          {result.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{result.name}</p>
                            {result.error && (
                              <p className="text-xs text-red-300 mt-1 break-words">{result.error}</p>
                            )}
                            {!result.passed && !result.error && (
                              <div className="text-xs mt-1 space-y-1">
                                <p className="break-words">
                                  <span className="text-muted-foreground">{t.expected}:</span>{" "}
                                  <code className="bg-green-500/20 px-1 rounded text-green-300">
                                    {JSON.stringify(result.expected)}
                                  </code>
                                </p>
                                <p className="break-words">
                                  <span className="text-muted-foreground">{t.received}:</span>{" "}
                                  <code className="bg-red-500/20 px-1 rounded text-red-300">
                                    {JSON.stringify(result.result)}
                                  </code>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {testResults.every(r => r.passed) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-primary/20 border border-primary rounded"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                          <div className="flex-1">
                            <p className="font-bold text-primary">🎉 {t.allTestsPassed}!</p>
                            <p className="text-xs text-muted-foreground">{t.allTestsPassed}</p>
                          </div>
                          <Button size="sm" onClick={handleNextExercise} className="gap-2">
                            {t.nextExercise} <SkipForward className="w-3 h-3" />
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
    <div className="h-[calc(100vh-64px)] min-h-[720px] flex flex-col">
      {/* Toolbar */}
      <div className="h-auto md:h-16 border-b border-white/10 bg-card/30 flex flex-col md:flex-row items-center px-4 py-2 md:py-0 justify-between shrink-0 gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 w-full md:w-auto">
          <h2 className="font-bold text-lg whitespace-nowrap hidden md:block">Exercícios</h2>
          
          {/* Seletor de Exercício */}
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

          {/* Seletor de Linguagem */}
          <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
            <SelectTrigger className="w-[120px] h-8 bg-white/5 border-white/10 text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
          <Button
            onClick={resetExecution}
            variant="ghost"
            size="icon"
            title={t.clear}
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
            {executionState.isExecuting ? t.executing : t.testCode}
          </Button>

          <div className="w-24 ml-2 hidden md:block">
            <Slider 
              value={[3000 - executionSpeed]} 
              min={100} 
              max={2900} 
              step={100} 
              onValueChange={(v) => setExecutionSpeed(3000 - v[0])} 
              title="Velocidade de execução"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
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
    </div>
  );
}
