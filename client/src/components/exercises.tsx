import React, { useState, useEffect, useRef } from "react";
import { exercises, type Exercise, type Language } from "@/lib/exercises-new";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { LanguageBadge } from '@/components/language-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Lightbulb, Eye, Code2, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { StackFrame, HeapObject } from "@/lib/types";
import { getPyodideInstance } from "@/lib/pyodide";
import { runInWorker, createWorkerController } from "@/lib/sandbox";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { checkAndConsumeExecution } from "@/lib/execution-limit";
// import removed: useLanguage

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
  const t: any = {};
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
  const controllerRef = useRef<any>(null);
  const autoStepIntervalRef = useRef<number | null>(null);
  const executionPausedRef = useRef<boolean>(false);
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
  // Ref to ensure dynamic reading of the value
  const executionSpeedRef = useRef(executionSpeed);
  useEffect(() => {
    executionSpeedRef.current = executionSpeed;
  }, [executionSpeed]);

  useEffect(() => {
    executionPausedRef.current = executionState.isPaused;
  }, [executionState.isPaused]);

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
        if (!trimmed) return "Empty line skipped";
    
    const assignMatch = trimmed.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(.*)/);
        if (assignMatch) {
          const varName = assignMatch[1];
          const newVal = newVars[varName];
          return `📝 Assigned ${JSON.stringify(newVal)} to "${varName}"`;
    }
    
    if (trimmed.startsWith("if ")) {
          return `❓ Checked: ${trimmed}`;
    }
    
    if (trimmed.startsWith("for ") || trimmed.startsWith("while ")) {
          return `🔄 Started a loop: ${trimmed.substring(0, 40)}...`;
    }
    
    if (trimmed.startsWith("return ")) {
      const returnVal = newVars.__result || trimmed;
          return `✅ Returned ${typeof returnVal === "object" ? JSON.stringify(returnVal) : returnVal}`;
    }
    
    if (trimmed.includes("console.log") || trimmed.includes("print")) {
          return `💬 Printed: ${trimmed.substring(0, 50)}...`;
    }
    
    return `⚙️ ${trimmed.substring(0, 60)}${trimmed.length > 60 ? "..." : ""}`;
  };

  const safeEvalExpression = (expr: string, state: Record<string, any>) => {
    try {
      // Evaluate in a narrowed context to avoid leaking global scope
      return new Function(
        "state",
        "Math",
        "JSON",
        "Array",
        "Object",
        `"use strict"; with(state){ return (${expr}); }`
      )({ ...state }, Math, JSON, Array, Object);
    } catch {
      return undefined;
    }
  };

  const buildStackAndHeap = (vars: Record<string, any>): { stack: StackFrame[]; heap: HeapObject[] } => {
    const variables: StackFrame["variables"] = Object.entries(vars).map(([name, value]) => {
      const isRef = value && typeof value === "object";
      return {
        name,
        value: isRef ? JSON.stringify(value) : value,
        type: isRef ? "reference" : "primitive",
        changed: true,
      };
    });

    const heap: HeapObject[] = Object.entries(vars)
      .filter(([, value]) => value && typeof value === "object")
      .map(([name, value], idx) => ({
        id: `${name}-${idx}`,
        className: Array.isArray(value) ? "Array" : "Object",
        properties: Object.entries(value as any).map(([k, v]) => ({
          name: k,
          value: typeof v === "object" ? JSON.stringify(v) : (v as any),
          type: typeof v === "object" ? "reference" : "primitive",
        })),
      }));

    return {
      stack: [
        {
          id: "global",
          name: "global",
          variables,
          active: true,
        },
      ],
      heap,
    };
  };

  const processLine = (line: string, prevVars: Record<string, any>) => {
    const updatedVars = { ...prevVars };
    let log = generateFriendlyLog(line, prevVars, updatedVars);

    const assignMatch = line.match(/(?:const|let|var)?\s*([\w$]+)\s*=\s*(.*)/);
    if (assignMatch) {
      const [, varName, rhsRaw] = assignMatch;
      const rhs = rhsRaw.replace(/;\s*$/, "");
      const val = safeEvalExpression(rhs, updatedVars);
      updatedVars[varName] = val;
      log = `🔧 ${varName} = ${JSON.stringify(val)}`;
    }

    const pushMatch = line.match(/([\w$]+)\.push\((.*)\)/);
    if (pushMatch) {
      const [, arrName, rhsRaw] = pushMatch;
      const rhs = rhsRaw.replace(/;\s*$/, "");
      const val = safeEvalExpression(rhs, updatedVars);
      if (!Array.isArray(updatedVars[arrName])) updatedVars[arrName] = [];
      (updatedVars[arrName] as any[]).push(val);
      log = `📦 pushed to ${arrName}: ${JSON.stringify(val)}`;
    }

    const { stack, heap } = buildStackAndHeap(updatedVars);
    return { updatedVars, stack, heap, log };
  };

  const runTests = () => {
    const allowance = checkAndConsumeExecution(user?.id, !!user?.isPro, 5);
    if (!allowance.allowed) {
      setTestResults([{ passed: false, name: "Daily Limit", error: "5 executions/day limit on the Free plan. Upgrade to Pro for unlimited executions." }]);
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
        setTestResults([{ passed: false, name: "Error", error: "No function found. Use 'function' to declare your function." }]);
        return;
      }

      const functionName = functionNameMatch[1];
      const results: any[] = [];
      for (const test of selectedExercise.tests) {
        try {
          const result = await (await import("@/lib/sandbox")).runInWorker(code, functionName, test.input, {
            timeoutMs: 3000,
            onStep: (line) => {
              try {
                setExecutionState(prev => ({ ...prev, currentLineIndex: Math.max(0, line - 1) }));
              } catch {}
            },
            onSnapshot: (vars) => {
              try { setExecutionState(prev => ({ ...prev, variables: vars || {} })); } catch {}
            }
          });
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
      setTestResults([{ passed: false, name: "Error", error: `${(e as any).message}` }]);
    }
  };

  const runPythonTests = async () => {
    try {
      const functionNameMatch = code.match(/def\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        setTestResults([{ passed: false, name: "Error", error: "No function found. Use 'def' to declare your function." }]);
        return;
      }

      const functionName = functionNameMatch[1];

      let py: any;
      try {
        py = await getPyodideInstance();
      } catch (e) {
        setTestResults([{ passed: false, name: "Error", error: "Failed to load Pyodide: " + ((e as any).message || String(e)) }]);
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
            results.push({ name: test.name, passed: false, error: parsed.error || parsed.trace || 'Error' });
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
      setTestResults([{ passed: false, name: "Error", error: `${(e as any).message}` }]);
    }
  };

  // Execution controlled by play/pause/step forward/step back
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
        setExecutionState(prev => {
          const { updatedVars, stack, heap, log } = processLine(line, prev.variables);
          const logs = log ? [...prev.logs, log].slice(-50) : prev.logs;
          return {
            ...prev,
            currentLineIndex: prev.currentLineIndex + 1,
            variables: updatedVars,
            stack,
            heap,
            logs,
          };
        });
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

  // Start line-by-line execution using the sandbox worker controller
  const startLineByLine = async () => {
    if (!allowExecution) {
      setPendingExecutionAction("line");
      setShowEnableExecutionConfirm(true);
      return;
    }
    if (selectedLanguage === "python") {
      setTestResults([{ passed: false, name: "Error", error: "Python requires server-side execution. Use JavaScript for quick in-browser tests." }]);
      return;
    }

    // clear any existing controller/interval
    try {
      if (controllerRef.current?.terminate) controllerRef.current.terminate();
    } catch {}
    if (autoStepIntervalRef.current) { clearInterval(autoStepIntervalRef.current); autoStepIntervalRef.current = null; }

    const lines = code.split('\n');
    setExecutionState(prev => ({
      ...prev,
      isExecuting: true,
      isPaused: false,
      currentLineIndex: 0,
      lines,
      errorLineIndex: null,
      errorMessage: null,
      variables: {},
      stack: [],
      heap: [],
      logs: [],
    }));

    const functionNameMatch = code.match(/function\s+(\w+)\s*\(/);
    const functionName = functionNameMatch ? functionNameMatch[1] : undefined;

    try {
      const controller = createWorkerController(code, functionName || '', [], {
        onStep: (line: number) => {
          setExecutionState(prev => ({ ...prev, currentLineIndex: Math.max(0, (line || 1) - 1) }));
        },
        onSnapshot: (snapshot: any, line?: number) => {
          setExecutionState(prev => ({ ...prev, variables: snapshot.vars || {}, stack: snapshot.stack || [], heap: snapshot.heap || [] }));
        }
      });

      controllerRef.current = controller;

      const stepOnce = () => {
        try { controller.step(); } catch {}
      };

      // first immediate step
      stepOnce();

      // auto-step interval
      autoStepIntervalRef.current = window.setInterval(() => {
        if (!executionPausedRef.current) stepOnce();
      }, executionSpeedRef.current);

      controller.result.then(() => {
        if (autoStepIntervalRef.current) { clearInterval(autoStepIntervalRef.current); autoStepIntervalRef.current = null; }
        controllerRef.current = null;
        setExecutionState(prev => ({ ...prev, isExecuting: false }));
      }).catch((err: any) => {
        if (autoStepIntervalRef.current) { clearInterval(autoStepIntervalRef.current); autoStepIntervalRef.current = null; }
        controllerRef.current = null;
        setExecutionState(prev => ({ ...prev, isExecuting: false, errorMessage: err?.message || String(err) }));
      });
    } catch (e) {
      setTestResults([{ passed: false, name: "Error", error: String(e) }]);
      setExecutionState(prev => ({ ...prev, isExecuting: false }));
    }
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
                <span>Challenges</span>
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
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
        </div>

        <div className="space-y-6">
          {/* Horizontal Exercises Bar */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white tracking-wide">Exercises</h3>
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
                    className={`flex-shrink-0 min-w-[160px] sm:min-w-[220px] text-left p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-blue-600/90 text-white shadow-lg shadow-blue-600/40 ring-1 ring-blue-300/30"
                        : "bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white"
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
            <Card className="p-6 bg-slate-900/60 border-slate-700 rounded-xl shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{selectedExercise.title}</h1>
                  <p className="text-slate-300 text-base md:text-lg">{selectedExercise.description}</p>
                </div>
                {isCompleted && (
                  <div className="text-right bg-green-500/15 border border-green-500/40 rounded-lg px-4 py-3">
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
                    ? "bg-green-500/15 text-green-300 border border-green-500/40"
                    : selectedExercise.difficulty === "Intermediate"
                    ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/40"
                    : "bg-red-500/15 text-red-300 border border-red-500/40"
                }`}>
                  {selectedExercise.difficulty}
                </span>
                {score > 0 && score < 100 && (
                  <span className="px-3 py-1 bg-purple-500/15 text-purple-300 rounded-full text-sm font-semibold border border-purple-500/40">
                    Score: {score}%
                  </span>
                )}
              </div>
            </Card>

            {/* Language & Security Controls - Simple */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <Card className="flex-1 p-4 bg-slate-900/60 border-slate-700 rounded-xl">
                <label className="text-sm font-semibold text-white mb-3 block">Linguagem:</label>
                <div className="flex gap-3 items-center">
                  <LanguageBadge />
                  <div className="text-sm text-slate-300">Supported: {availableLanguages.join(', ')}</div>
                </div>
              </Card>

              <Card className="flex-1 p-4 bg-slate-900/60 border-slate-700 rounded-xl">
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={allowExecution}
                    onChange={(e) => setAllowExecution(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-slate-700 rounded"
                  />
                  <span className="font-semibold">Run code</span>
                </label>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="code">
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm">
                <TabsTrigger value="code" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Code
                </TabsTrigger>
                <TabsTrigger value="tests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  ✓ Testes ({testResults.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4 mt-6">
                {/* Code Editor */}
                <Card className="p-4 bg-slate-900/60 border-slate-700 rounded-xl">
                  <div className="flex items-start justify-between mb-3 gap-4">
                        <div>
                          <label className="text-lg font-bold text-white block">Code editor — Step-by-step</label>
                          <div className="text-sm text-slate-300 mt-1">Edit the code, then press <span className="font-mono">Run</span> to watch each line execute.</div>
                        </div>
                        <div className="ml-auto text-right">
                          <span className="text-[11px] text-slate-300">Ctrl/⌘ + Enter runs tests</span>
                        </div>
                      </div>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-950/80 border-r border-slate-700 flex flex-col overflow-hidden">
                      {executionState.lines.map((_, idx) => (
                        <motion.div
                          key={idx}
                          className={`px-3 py-1 text-xs text-center font-mono leading-6 transition-all ${
                            idx === executionState.currentLineIndex - 1
                              ? "bg-green-600/90 text-white font-bold"
                              : idx === executionState.errorLineIndex
                              ? "bg-red-600/90 text-white font-bold"
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
                      // Allow editing while execution is running so users can type freely
                      className={`w-full h-72 md:h-[480px] lg:h-[560px] p-4 pl-20 text-base rounded border resize-vertical focus:outline-none focus:ring-2 transition-all font-mono ${editorProClass}`}
                      placeholder="Write your code here..."
                      aria-label={`Code editor (${selectedLanguage})`}
                      spellCheck="false"
                    />
                    <div className="mt-3 p-3 bg-slate-800/60 border border-white/5 rounded text-sm text-gray-200">
                      <div className="font-semibold text-amber-300">Beginner Tips</div>
                      <ul className="mt-2 text-xs text-gray-300 space-y-1 list-inside list-decimal">
                        <li>Start small: change one line and press <span className="font-mono">Run</span>.</li>
                        <li>Watch the highlighted line to see execution order.</li>
                        <li>Use the Variables panel to inspect values after each step.</li>
                      </ul>
                    </div>
                  </div>
                  {/* Barra de controles igual ao playground */}
                  <div className="flex items-center gap-2 mt-4 p-2 bg-slate-800/80 border border-slate-700 rounded-lg justify-center divide-x divide-slate-700">
                    <Button variant="ghost" size="icon" onClick={() => {
                      try { if (controllerRef.current?.terminate) controllerRef.current.terminate(); } catch {}
                      if (autoStepIntervalRef.current) { clearInterval(autoStepIntervalRef.current); autoStepIntervalRef.current = null; }
                      controllerRef.current = null;
                      setExecutionState((prev) => ({ ...prev, currentLineIndex: 0, errorLineIndex: null, errorMessage: null, isExecuting: false }));
                    }} aria-label="Back to Start">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      try {
                        if (controllerRef.current) {
                          try { controllerRef.current.terminate(); } catch {}
                          controllerRef.current = null;
                          if (autoStepIntervalRef.current) { clearInterval(autoStepIntervalRef.current); autoStepIntervalRef.current = null; }
                        }
                      } catch {}
                      setExecutionState((prev) => ({ ...prev, currentLineIndex: Math.max(0, prev.currentLineIndex - 1), errorLineIndex: null, errorMessage: null, isExecuting: false }));
                    }} aria-label="Previous Step">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={async () => {
                      if (!executionState.isExecuting) {
                        await startLineByLine();
                        return;
                      }
                      const newPaused = !executionState.isPaused;
                      try {
                        if (!newPaused && controllerRef.current?.resume) controllerRef.current.resume();
                      } catch {}
                      executionPausedRef.current = newPaused;
                      setExecutionState((prev) => ({ ...prev, isPaused: newPaused }));
                    }} aria-pressed={executionState.isPaused} aria-label={executionState.isPaused ? "Run" : "Pause"}>
                      {executionState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (controllerRef.current?.step) {
                        try { controllerRef.current.step(); } catch {}
                      } else {
                        setExecutionState((prev) => ({ ...prev, currentLineIndex: Math.min(prev.lines.length, prev.currentLineIndex + 1), errorLineIndex: null, errorMessage: null }));
                      }
                    }} aria-label="Next Step">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center ml-4 pl-4">
                      <Slider
                        min={10}
                        max={500}
                        step={10}
                        value={[executionSpeed]}
                        onValueChange={([val]) => setExecutionSpeed(val)}
                        className="w-28"
                        aria-label="Execution speed"
                      />
                      <span className="text-xs text-slate-300 ml-2" style={{minWidth: 48, textAlign: 'right'}}>{executionSpeed} ms</span>
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
                            <p className="text-sm font-semibold text-red-300 mb-1">❌ Error on line {executionState.errorLineIndex + 1}</p>
                            <p className="text-sm text-red-200">{executionState.errorMessage}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Legend above visualizers */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-400/30">🔵 Variables (stack)</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30">🟢 Memory (heap)</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-400/30">⚙️ Execution (logs)</span>
                </div>

                {/* Below editor: 3 columns - Variables, Memory, Logs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x divide-slate-700 rounded-xl border border-slate-700 overflow-hidden bg-slate-900/50">
                  {/* Column 1: Variables */}
                  <div className="p-4 overflow-auto max-h-72 flex flex-col">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3 tracking-wide">🔵 Variables</h4>
                    <CallStack stack={executionState.stack} />
                  </div>

                  {/* Column 2: Memory */}
                  <div className="p-4 overflow-auto max-h-72">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-3 tracking-wide">🟢 Memory</h4>
                    <HeapMemory heap={executionState.heap} />
                  </div>

                  {/* Column 3: What Computer Did */}
                  <div className="p-4 overflow-auto max-h-72">
                    <h4 className="text-sm font-semibold text-yellow-300 mb-3 tracking-wide">⚙️ Execution</h4>
                    {executionState.logs.length === 0 ? (
                      <p className="text-xs text-slate-400">Run the code to see the step-by-step actions the computer performs.</p>
                    ) : (
                      <div className="space-y-2">
                        {executionState.logs.slice(-8).reverse().map((l, i) => (
                          <div key={i} className="text-sm text-slate-200 bg-black/30 border border-slate-700/60 p-2 rounded">
                            {l}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                <div className="flex gap-3 flex-wrap">
                  {/* Removed duplicate Run/Start buttons per user request; use Play/Pause control above */}
                  <Button
                    onClick={() => {
                      if (currentVariant?.solution) {
                        setShowUseSolutionConfirm(true);
                      }
                    }}
                    variant="outline"
                    className="border-green-600 text-green-300 hover:bg-green-700/30"
                  >
                    ✓ Solution
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
                            Yes
                          </Button>
                            <Button onClick={() => setShowUseSolutionConfirm(false)} variant="outline" className="text-xs px-2 py-1 h-8">
                            No
                          </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      try { if (controllerRef.current?.terminate) controllerRef.current.terminate(); } catch {}
                      if (autoStepIntervalRef.current) { clearInterval(autoStepIntervalRef.current); autoStepIntervalRef.current = null; }
                      controllerRef.current = null;
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
                    }}
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
                    Hint (Pro)
                  </Button>
                  <Button
                    onClick={() => setShowSolution(!showSolution)}
                    disabled={!currentVariant?.solution || !isPro}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Solution (Pro)
                  </Button>
                </div>
                {!isPro && (
                  <p className="text-xs text-amber-200 mt-2">Pro Exclusive: upgrade to unlock hints and full solutions.</p>
                )}

                {showEnableExecutionConfirm && (
                  <Card className="p-3 bg-slate-800 border-l-4 border-slate-600 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-200">Enable execution?</p>
                        <p className="text-xs text-slate-400">Code will be executed in the browser.</p>
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
                          Yes
                        </Button>
                        <Button onClick={() => { setShowEnableExecutionConfirm(false); setPendingExecutionAction(null); }} variant="outline">No</Button>
                      </div>
                    </div>
                  </Card>
                )}

                {showHint && currentVariant?.hint && isPro && (
                  <Card className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500">
                    <p className="text-sm font-semibold text-yellow-300 mb-1">💡 Hint</p>
                    <p className="text-sm text-yellow-200">{currentVariant.hint}</p>
                  </Card>
                )}

                {showSolution && currentVariant && isPro && (
                  <Card className="p-4 bg-green-500/10 border-l-4 border-green-500">
                    <p className="text-sm font-semibold text-green-300 mb-3">✓ Solution</p>
                    <pre className="bg-slate-900 p-4 rounded text-xs overflow-x-auto border border-slate-700">
                      <code className="text-slate-200">{currentVariant.solution}</code>
                    </pre>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tests" className="space-y-4 mt-6">
                {testResults.length === 0 ? (
                  <Card className="p-12 bg-slate-900/60 border-slate-700 rounded-xl text-center">
                    <p className="text-slate-400 text-lg">Run to see results</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, idx) => (
                      <Card
                        key={idx}
                        className={`p-4 rounded-xl border-2 ${
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
                                <p>Expected: <code className="bg-slate-900 px-2 py-1 rounded text-green-300">{JSON.stringify(result.expected)}</code></p>
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
                            <p className="font-bold text-blue-300 text-lg">🎉 Congratulations!</p>
                            <p className="text-sm text-blue-200">Next Challenge</p>
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
