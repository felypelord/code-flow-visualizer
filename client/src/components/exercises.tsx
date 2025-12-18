import React, { useState, useEffect, useRef } from "react";
import { exercises, type Exercise, type Language } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Lightbulb, Eye, Code2, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { StackFrame, HeapObject } from "@/lib/types";
import { getPyodideInstance } from "@/lib/pyodide";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { checkAndConsumeExecution } from "@/lib/execution-limit";

interface ExerciseProgressState {
  [exerciseId: string]: {
    completed: boolean;
    score: number;
    attempts: number;
    code: string;
    language: Language;
  };
}

interface ExecutionState {
  isExecuting: boolean;
  isPaused: boolean;
  currentLineIndex: number;
  lines: string[];
  errorLineIndex: number | null;
  errorMessage: string | null;
  variables: Record<string, any>;
  stack: StackFrame[];
  heap: HeapObject[];
  logs: string[];
}

export function ExercisesView() {
  const { user } = useUser();
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [progress, setProgress] = useState<ExerciseProgressState>({});
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    isPaused: false,
    currentLineIndex: -1,
    lines: [],
    errorLineIndex: null,
    errorMessage: null,
    variables: {},
    stack: [],
    heap: [],
    logs: [],
  });
  const [showUseSolutionConfirm, setShowUseSolutionConfirm] = useState(false);
  const [showEnableExecutionConfirm, setShowEnableExecutionConfirm] = useState(false);
  const [pendingExecutionAction, setPendingExecutionAction] = useState<"line" | "tests" | null>(null);
  const isPro = !!user?.isPro;

  const [allowExecution, setAllowExecution] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("allowExecution") || "false");
    } catch {
      return false;
    }
  });
  const [executionSpeed, setExecutionSpeed] = useState<number>(() => {
    try {
      const val = Number(localStorage.getItem("executionSpeed")) || 500;
      return Math.max(10, Math.min(500, val));
    } catch {
      return 500;
    }
  });
  // Ref para garantir leitura dinâmica do valor
  const executionSpeedRef = useRef(executionSpeed);
  useEffect(() => {
    executionSpeedRef.current = executionSpeed;
  }, [executionSpeed]);

  useEffect(() => {
    localStorage.setItem("executionSpeed", String(executionSpeed));
  }, [executionSpeed]);

  useEffect(() => {
    localStorage.setItem("allowExecution", JSON.stringify(allowExecution));
  }, [allowExecution]);

  useEffect(() => {
    const saved = localStorage.getItem("exerciseProgress");
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
  }, []);

  useEffect(() => {
    const variant = selectedExercise.variants[selectedLanguage];
    const saveKey = `${selectedExercise.id}-${selectedLanguage}`;
    const savedProgress = progress[saveKey];
    
    if (savedProgress?.code) {
      setCode(savedProgress.code);
    } else if (variant) {
      setCode(variant.initialCode);
    }
    setTestResults([]);
    setShowSolution(false);
    setShowHint(false);
    setAllPassed(false);
  }, [selectedExercise, selectedLanguage, progress]);

  useEffect(() => {
    const saveKey = `${selectedExercise.id}-${selectedLanguage}`;
    const currentProgress = progress[saveKey] || { completed: false, score: 0, attempts: 0, code: "", language: selectedLanguage };
    const newProgress = {
      ...progress,
      [saveKey]: {
        ...currentProgress,
        code,
        language: selectedLanguage,
      },
    };
    localStorage.setItem("exerciseProgress", JSON.stringify(newProgress));
  }, [code, selectedExercise.id, selectedLanguage]);

  const saveTestProgress = (completed: boolean, score: number) => {
    const saveKey = `${selectedExercise.id}-${selectedLanguage}`;
    const currentProgress = progress[saveKey] || { completed: false, score: 0, attempts: 0, code: "", language: selectedLanguage };
    setProgress({
      ...progress,
      [saveKey]: {
        completed,
        score,
        attempts: (currentProgress.attempts || 0) + 1,
        code,
        language: selectedLanguage,
      },
    });
  };

  const generateFriendlyLog = (line: string, prevVars: Record<string, any>, newVars: Record<string, any>): string => {
    const trimmed = line.trim();
    if (!trimmed) return "Linha vazia pulada";
    
    const assignMatch = trimmed.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(.*)/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const newVal = newVars[varName];
      return `📝 Colocou ${JSON.stringify(newVal)} em "${varName}"`;
    }
    
    if (trimmed.startsWith("if ")) {
      return `❓ Verificou: ${trimmed}`;
    }
    
    if (trimmed.startsWith("for ") || trimmed.startsWith("while ")) {
      return `🔄 Iniciou um laço: ${trimmed.substring(0, 40)}...`;
    }
    
    if (trimmed.startsWith("return ")) {
      const returnVal = newVars.__result || trimmed;
      return `✅ Retornou ${typeof returnVal === "object" ? JSON.stringify(returnVal) : returnVal}`;
    }
    
    if (trimmed.includes("console.log") || trimmed.includes("print")) {
      return `💬 Imprimiu na tela: ${trimmed.substring(0, 50)}...`;
    }
    
    return `⚙️ ${trimmed.substring(0, 60)}${trimmed.length > 60 ? "..." : ""}`;
  };

  const runTests = () => {
    const allowance = checkAndConsumeExecution(user?.id, !!user?.isPro, 5);
    if (!allowance.allowed) {
      setTestResults([{ passed: false, name: "Limite diário", error: "Limite de 5 execuções/dia no plano Free. Faça upgrade para Pro para execuções ilimitadas." }]);
      setAllPassed(false);
      return;
    }
    if (!allowExecution) {
      setPendingExecutionAction("tests");
      setShowEnableExecutionConfirm(true);
      return;
    }

    if (selectedLanguage === "python") {
      runPythonTests();
    } else {
      runJavaScriptTests();
    }
  };

  const runJavaScriptTests = async () => {
    try {
      const functionNameMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        setTestResults([{ passed: false, name: "Erro", error: "Nenhuma função encontrada. Use 'function' para declarar sua função." }]);
        return;
      }

      const functionName = functionNameMatch[1];
      const results: any[] = [];
      for (const test of selectedExercise.tests) {
        try {
          const result = await (await import("@/lib/sandbox")).runInWorker(code, functionName, test.input, { timeoutMs: 3000 });
          const passed = JSON.stringify(result) === JSON.stringify(test.expected);
          results.push({ name: test.name, passed, result, expected: test.expected, error: null });
        } catch (e: any) {
          results.push({ name: test.name, passed: false, error: e?.message || String(e) });
        }
      }

      setTestResults(results);
      const isPassed = results.every((r) => r.passed);
      setAllPassed(isPassed);

      if (isPassed) {
        saveTestProgress(true, 100);
      } else {
        const passedCount = results.filter((r) => r.passed).length;
        const score = Math.round((passedCount / results.length) * 100);
        saveTestProgress(false, score);
      }
    } catch (e) {
      setTestResults([{ passed: false, name: "Erro", error: `${(e as any).message}` }]);
    }
  };

  const runPythonTests = async () => {
    try {
      const functionNameMatch = code.match(/def\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        setTestResults([{ passed: false, name: "Erro", error: "Nenhuma função encontrada. Use 'def' para declarar sua função." }]);
        return;
      }

      const functionName = functionNameMatch[1];

      let py: any;
      try {
        py = await getPyodideInstance();
      } catch (e) {
        setTestResults([{ passed: false, name: "Erro", error: "Falha ao carregar Pyodide: " + ((e as any).message || String(e)) }]);
        return;
      }

      const results: any[] = [];

      for (const test of selectedExercise.tests) {
        try {
          const inputJSON = JSON.stringify(test.input);
          const script = `${code}\nimport json\n\ndef __run_test():\n  try:\n    val = ${functionName}(*${inputJSON})\n    return json.dumps({'ok': True, 'result': val})\n  except Exception as e:\n    import traceback\n    return json.dumps({'ok': False, 'error': str(e), 'trace': traceback.format_exc()})\n\n__run_test()`;

          const res = await py.runPythonAsync(script);
          const resStr = typeof res === 'string' ? res : String(res);
          const parsed = JSON.parse(resStr);

          if (parsed.ok) {
            const passed = JSON.stringify(parsed.result) === JSON.stringify(test.expected);
            results.push({ name: test.name, passed, result: parsed.result, expected: test.expected, error: null });
          } else {
            results.push({ name: test.name, passed: false, error: parsed.error || parsed.trace || 'Erro' });
          }
        } catch (e) {
          results.push({ name: test.name, passed: false, error: (e as any).message || String(e) });
        }
      }

      setTestResults(results);
      const isPassed = results.every((r) => r.passed);
      setAllPassed(isPassed);

      if (isPassed) {
        saveTestProgress(true, 100);
      } else {
        const passedCount = results.filter((r) => r.passed).length;
        const score = Math.round((passedCount / results.length) * 100);
        saveTestProgress(false, score);
      }
    } catch (e) {
      setTestResults([{ passed: false, name: "Erro", error: `${(e as any).message}` }]);
    }
  };

  // Execução controlada por play/pause/avançar/voltar
  useEffect(() => {
    let shouldRun = true;
    if (!executionState.isExecuting || executionState.isPaused) return;
    const runStep = async () => {
      const { lines, currentLineIndex } = executionState;
      if (currentLineIndex >= lines.length) {
        setExecutionState(prev => ({ ...prev, isExecuting: false }));
        return;
      }
      const line = lines[currentLineIndex];
      if (line.trim().length === 0) {
        setExecutionState(prev => ({ ...prev, currentLineIndex: prev.currentLineIndex + 1 }));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, executionSpeedRef.current));
      try {
        // Simulação simplificada: só avança linha
        setExecutionState(prev => ({ ...prev, currentLineIndex: prev.currentLineIndex + 1 }));
      } catch (e) {
        setExecutionState(prev => ({ ...prev, isExecuting: false, errorLineIndex: currentLineIndex, errorMessage: (e as any).message }));
      }
    };
    runStep();
    const interval = setInterval(() => {
      if (!shouldRun || executionState.isPaused || !executionState.isExecuting) {
        clearInterval(interval);
        return;
      }
      runStep();
    }, executionSpeedRef.current);
    return () => {
      shouldRun = false;
      clearInterval(interval);
    };
  }, [executionState.isExecuting, executionState.isPaused, executionState.currentLineIndex, executionSpeed]);

  // Iniciar execução linha a linha
  const startLineByLine = () => {
    if (!allowExecution) {
      setPendingExecutionAction("line");
      setShowEnableExecutionConfirm(true);
      return;
    }
    if (selectedLanguage === "python") {
      setTestResults([{ passed: false, name: "Erro", error: "Python requer execução no servidor. Use JavaScript para testes rápidos no navegador." }]);
      return;
    }
    const lines = code.split('\n');
    setExecutionState(prev => ({
      ...prev,
      isExecuting: true,
      isPaused: false,
      currentLineIndex: 0,
      lines,
      errorLineIndex: null,
      errorMessage: null,
      logs: [],
    }));
  };

  const currentVariant = selectedExercise.variants[selectedLanguage];
  const availableLanguages = Object.keys(selectedExercise.variants) as Language[];
  
  const saveKey = `${selectedExercise.id}-${selectedLanguage}`;
  const currentProgress = progress[saveKey];
  const isCompleted = currentProgress?.completed || false;
  const score = currentProgress?.score || 0;
  const attempts = currentProgress?.attempts || 0;
  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const progressPercentage = Math.round((completedCount / (exercises.length * 2)) * 100);
  const editorProClass = isPro
    ? "bg-[#0b1020] text-slate-50 border-violet-500/70 shadow-[0_0_18px_rgba(139,92,246,0.45)] focus:ring-violet-400/70 font-['JetBrains_Mono',SFMono-Regular,Menlo,Monaco,Consolas,monospace]"
    : "bg-slate-900 text-slate-50 border-slate-600 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                <span>Desafios</span>
              </h1>
              <p className="text-xs sm:text-base text-slate-300">JavaScript ou Python</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 sm:px-4 sm:py-3 flex-shrink-0">
              <p className="text-blue-300 text-xs sm:text-sm font-semibold">Progresso</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{completedCount}/{exercises.length * availableLanguages.length}</p>
            </div>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Horizontal Exercises Bar */}
          <div className="bg-slate-800/40 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Exercícios</h3>
              <div className="text-xs text-slate-300">Clique para selecionar</div>
            </div>
            <div className="flex gap-3 overflow-x-auto py-2">
              {exercises.map((ex, idx) => {
                const exKeys = Object.keys(ex.variants) as Language[];
                const isSelected = selectedExercise.id === ex.id;
                const anyCompleted = exKeys.some(lang => progress[`${ex.id}-${lang}`]?.completed);
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex)}
                    className={`flex-shrink-0 min-w-[150px] sm:min-w-[200px] text-left p-2 sm:p-3 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-400 mb-1">#{idx + 1}</div>
                        <div className="font-semibold text-sm line-clamp-2">{ex.title}</div>
                        <div className={`text-xs mt-1 ${
                          ex.difficulty === "Beginner"
                            ? "text-green-400"
                            : ex.difficulty === "Intermediate"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}>
                          {ex.difficulty}
                        </div>
                      </div>
                      {anyCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Exercise Title Card */}
            <Card className="p-6 bg-slate-800 border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{selectedExercise.title}</h1>
                  <p className="text-slate-300 text-lg">{selectedExercise.description}</p>
                </div>
                {isCompleted && (
                  <div className="text-right bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      Completo!
                    </div>
                    <p className="text-green-300 text-sm mt-1">Tentativas: {attempts}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedExercise.difficulty === "Beginner"
                    ? "bg-green-500/20 text-green-300 border border-green-500/50"
                    : selectedExercise.difficulty === "Intermediate"
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                    : "bg-red-500/20 text-red-300 border border-red-500/50"
                }`}>
                  {selectedExercise.difficulty}
                </span>
                {score > 0 && score < 100 && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold border border-purple-500/50">
                    Score: {score}%
                  </span>
                )}
              </div>
            </Card>

            {/* Language & Security Controls - Simple */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="flex-1 p-4 bg-slate-800 border-slate-700">
                <label className="text-sm font-semibold text-white mb-3 block">Linguagem:</label>
                <div className="flex gap-2">
                  {availableLanguages.map((lang) => (
                    <Button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      variant={selectedLanguage === lang ? "default" : "outline"}
                      className={`flex-1 ${
                        selectedLanguage === lang
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-slate-600 text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      {lang === "javascript" ? "JS" : "Py"}
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="flex-1 p-4 bg-slate-800 border-slate-700">
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={allowExecution}
                    onChange={(e) => setAllowExecution(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-slate-700 rounded"
                  />
                  <span className="font-semibold">Executar código</span>
                </label>
              </Card>
            </div>

            {/* Tabs */}
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
                <TabsTrigger value="code" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Código
                </TabsTrigger>
                <TabsTrigger value="tests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  ✓ Testes ({testResults.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4 mt-6">
                  const result = await (await import("@/lib/sandbox")).runInWorker(code, functionName, test.input, { timeoutMs: isPro ? 6000 : 3000 });
                {/* Code Editor */}
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <label className="text-sm font-semibold text-white mb-3 block">Código:</label>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900 border-r border-slate-600 flex flex-col overflow-hidden">
                      {executionState.lines.map((_, idx) => (
                        <motion.div
                          key={idx}
                          className={`px-3 py-1 text-xs text-center font-mono leading-6 transition-all ${
                            idx === executionState.currentLineIndex - 1
                              ? "bg-green-600 text-white font-bold"
                              : idx === executionState.errorLineIndex
                              ? "bg-red-600 text-white font-bold"
                              : "text-slate-500"
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {idx + 1}
                        </motion.div>
                      ))}
                    </div>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => {
                        const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
                        const mod = isMac ? e.metaKey : e.ctrlKey;
                        if (mod && e.key === 'Enter') {
                          e.preventDefault();
                          runTests();
                        }
                      }}
                      disabled={executionState.isExecuting}
                      className={`w-full h-64 md:h-96 p-3 pl-16 text-sm rounded border resize-vertical focus:outline-none focus:ring-2 transition-all ${editorProClass}`}
                      placeholder="Escreva seu código aqui..."
                      aria-label={`Editor de código (${selectedLanguage})`}
                      spellCheck="false"
                    />
                  </div>
                  {/* Barra de controles igual ao playground */}
                  <div className="flex items-center gap-2 mt-4 p-2 bg-slate-700 rounded justify-center">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setExecutionState((prev) => ({ ...prev, currentLineIndex: 0, errorLineIndex: null, errorMessage: null }));
                    }} aria-label="Voltar ao início">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setExecutionState((prev) => ({ ...prev, currentLineIndex: Math.max(0, prev.currentLineIndex - 1), errorLineIndex: null, errorMessage: null }));
                    }} aria-label="Passo anterior">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={() => {
                      setExecutionState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
                    }} aria-pressed={executionState.isPaused} aria-label={executionState.isPaused ? "Executar" : "Pausar"}>
                      {executionState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setExecutionState((prev) => ({ ...prev, currentLineIndex: Math.min(prev.lines.length, prev.currentLineIndex + 1), errorLineIndex: null, errorMessage: null }));
                    }} aria-label="Próximo passo">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center ml-4">
                      <Slider
                        min={10}
                        max={500}
                        step={10}
                        value={[executionSpeed]}
                        onValueChange={([val]) => setExecutionSpeed(val)}
                        className="w-28"
                        aria-label="Velocidade de execução"
                      />
                      <span className="text-xs text-slate-300 ml-2" style={{minWidth: 40, textAlign: 'right'}}>{executionSpeed} ms</span>
                    </div>
                  </div>
                </Card>

                {/* Error Display */}
                <AnimatePresence>
                  {executionState.errorLineIndex !== null && executionState.errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="p-4 bg-red-500/10 border-l-4 border-red-500">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-300 mb-1">❌ Erro na linha {executionState.errorLineIndex + 1}</p>
                            <p className="text-sm text-red-200">{executionState.errorMessage}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Below editor: 3 columns - Variables, Memory, Logs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Column 1: Variables */}
                  <Card className="p-4 bg-slate-800 border-slate-700 overflow-auto max-h-64 flex flex-col">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">🔵 Variáveis</h4>
                    <CallStack stack={executionState.stack} />
                  </Card>

                  {/* Column 2: Memory */}
                  <Card className="p-4 bg-slate-800 border-slate-700 overflow-auto max-h-64">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-3">🟢 Memória</h4>
                    <HeapMemory heap={executionState.heap} />
                  </Card>

                  {/* Column 3: What Computer Did */}
                  <Card className="p-4 bg-slate-800 border-slate-700 overflow-auto max-h-64">
                    <h4 className="text-sm font-semibold text-yellow-300 mb-3">⚙️ Executado</h4>
                    {executionState.logs.length === 0 ? (
                      <p className="text-xs text-slate-400">Execute o código para ver os passos.</p>
                    ) : (
                      <div className="space-y-2">
                        {executionState.logs.slice(-8).reverse().map((l, i) => (
                          <div key={i} className="text-xs text-slate-200 bg-black/20 p-2 rounded">
                            {l}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={startLineByLine}
                    disabled={executionState.isExecuting}
                    className="flex-1 min-w-[120px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-60"
                  >
                    {executionState.isExecuting ? (
                      <>
                        <Play className="w-4 h-4 mr-2 animate-pulse" />
                        Executando...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Executar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (currentVariant?.solution) {
                        setShowUseSolutionConfirm(true);
                      }
                    }}
                    variant="outline"
                    className="border-green-600 text-green-300 hover:bg-green-700/30"
                  >
                    ✓ Solução
                  </Button>

                  {showUseSolutionConfirm && (
                      <div className="flex gap-2 mt-1">
                          <Button
                            onClick={() => {
                              if (currentVariant?.solution) {
                                setCode(currentVariant.solution);
                                setExecutionState({
                                  isExecuting: false,
                                  isPaused: false,
                                  currentLineIndex: -1,
                                  lines: [],
                                  errorLineIndex: null,
                                  errorMessage: null,
                                  variables: {},
                                  stack: [],
                                  heap: [],
                                  logs: [],
                                });
                              }
                              setShowUseSolutionConfirm(false);
                            }}
                              className="bg-green-600 text-xs px-2 py-1 h-8"
                          >
                            Sim
                          </Button>
                            <Button onClick={() => setShowUseSolutionConfirm(false)} variant="outline" className="text-xs px-2 py-1 h-8">
                            Não
                          </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => setExecutionState({
                      isExecuting: false,
                      isPaused: false,
                      currentLineIndex: -1,
                      lines: [],
                      errorLineIndex: null,
                      errorMessage: null,
                      variables: {},
                      stack: [],
                      heap: [],
                      logs: [],
                    })}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                  <Button
                    onClick={() => setShowHint(!showHint)}
                    disabled={!currentVariant?.hint || !isPro}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Dica (Pro)
                  </Button>
                  <Button
                    onClick={() => setShowSolution(!showSolution)}
                    disabled={!currentVariant?.solution || !isPro}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Solução (Pro)
                  </Button>
                </div>
                {!isPro && (
                  <p className="text-xs text-amber-200 mt-2">Exclusivo Pro: faça upgrade para desbloquear dicas e soluções completas.</p>
                )}

                {showEnableExecutionConfirm && (
                  <Card className="p-3 bg-slate-800 border-l-4 border-slate-600 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-200">Ativar execução?</p>
                        <p className="text-xs text-slate-400">Código será executado no navegador.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setAllowExecution(true);
                            setShowEnableExecutionConfirm(false);
                            const action = pendingExecutionAction;
                            setPendingExecutionAction(null);
                            if (action === "line") startLineByLine();
                            if (action === "tests") runTests();
                          }}
                          className="bg-green-600"
                        >
                          Sim
                        </Button>
                        <Button onClick={() => { setShowEnableExecutionConfirm(false); setPendingExecutionAction(null); }} variant="outline">Não</Button>
                      </div>
                    </div>
                  </Card>
                )}

                {showHint && currentVariant?.hint && isPro && (
                  <Card className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500">
                    <p className="text-sm font-semibold text-yellow-300 mb-1">💡 Dica</p>
                    <p className="text-sm text-yellow-200">{currentVariant.hint}</p>
                  </Card>
                )}

                {showSolution && currentVariant && isPro && (
                  <Card className="p-4 bg-green-500/10 border-l-4 border-green-500">
                    <p className="text-sm font-semibold text-green-300 mb-3">✓ Solução</p>
                    <pre className="bg-slate-900 p-4 rounded text-xs overflow-x-auto border border-slate-700">
                      <code className="text-slate-200">{currentVariant.solution}</code>
                    </pre>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tests" className="space-y-4 mt-6">
                {testResults.length === 0 ? (
                  <Card className="p-12 bg-slate-800 border-slate-700 text-center">
                    <p className="text-slate-400 text-lg">Execute para ver resultados</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, idx) => (
                      <Card
                        key={idx}
                        className={`p-4 border-2 ${
                          result.passed
                            ? "bg-green-500/10 border-green-500"
                            : "bg-red-500/10 border-red-500"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {result.passed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-semibold ${result.passed ? "text-green-300" : "text-red-300"}`}>
                              {result.name}
                            </p>
                            {result.error && (
                              <p className="text-sm text-red-300 mt-1 bg-red-900/20 p-2 rounded">
                                {result.error}
                              </p>
                            )}
                            {!result.error && !result.passed && (
                              <div className="text-sm mt-2 space-y-1 text-slate-300">
                                <p>Esperado: <code className="bg-slate-900 px-2 py-1 rounded text-green-300">{JSON.stringify(result.expected)}</code></p>
                                <p>Obtido: <code className="bg-slate-900 px-2 py-1 rounded text-red-300">{JSON.stringify(result.result)}</code></p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}

                    {allPassed && (
                      <Card className="p-4 bg-blue-500/20 border-2 border-blue-500">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-8 h-8 text-blue-400" />
                          <div>
                            <p className="font-bold text-blue-300 text-lg">🎉 Parabéns!</p>
                            <p className="text-sm text-blue-200">Próximo desafio →</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
