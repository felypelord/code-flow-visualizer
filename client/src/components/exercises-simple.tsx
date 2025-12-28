import React, { useState, useEffect, useRef } from "react";
import { exercises, type Exercise, type Language } from "@/lib/exercises-new";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageBadge } from '@/components/language-selector';
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Lightbulb, Eye, Code2, Play, RotateCcw } from "lucide-react";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { StackFrame, HeapObject } from "@/lib/types";
import { getPyodideInstance } from "@/lib/pyodide";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
// import removed: useLanguage
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
  const { toast } = useToast();
  // const t = {};
  const { user } = useUser();
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [showUseSolutionConfirm, setShowUseSolutionConfirm] = useState(false);
  const [showEnableExecutionConfirm, setShowEnableExecutionConfirm] = useState(false);
  const [pendingExecutionAction, setPendingExecutionAction] = useState<"line" | "tests" | null>(null);
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

  const editorRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Security: Validate and sanitize code
  const validateCode = (code: string, language: Language): { valid: boolean; error?: string } => {
    // Block dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /fetch\s*\(/gi,
      /XMLHttpRequest/gi,
      /import\s+/gi,
      /require\s*\(/gi,
      /<script/gi,
      /innerHTML/gi,
      /outerHTML/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return { 
          valid: false, 
          error: `🛑 Code blocked for safety: pattern "${pattern.source}" is not allowed. Use only simple programming logic.` 
        };
      }
    }

    // Check code length
    if (code.length > 10000) {
      return { valid: false, error: "Code too long. Limit: 10,000 characters." };
    }

    // Check for excessive loops (rough heuristic)
    const loopCount = (code.match(/\b(for|while)\b/g) || []).length;
    if (loopCount > 5) {
      return { valid: false, error: "Too many loops detected. Maximum allowed: 5." };
    }

    return { valid: true };
  };

  // Security: Execute with timeout
  const executeWithTimeout = async <T,>(fn: () => Promise<T> | T, timeoutMs: number = 10000): Promise<T> => {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error("⏱️ Time out! Code took more than 10 seconds. Check for infinite loops.")), timeoutMs)
      )
    ]);
  };

  const runTests = () => {
    const allowance = checkAndConsumeExecution(user?.id, !!user?.isPro, 5);
    if (!allowance.allowed) {
      setTestResults([{ passed: false, name: "Daily Limit", error: "5 executions/day limit on the Free plan. Upgrade to Pro for unlimited runs." }]);
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
      // Security: Validate code first
      const validation = validateCode(code, "javascript");
      if (!validation.valid) {
        setTestResults([{ passed: false, name: "🛑 Security", error: validation.error! }]);
        return;
      }

      const functionNameMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        setTestResults([{ passed: false, name: "Error", error: "No function found. Use 'function' to declare your function." }]);
        return;
      }

      const functionName = functionNameMatch[1];
      const results: any[] = [];
      const jsTimeoutMs = user?.isPro ? 6000 : 3000;
      for (const test of selectedExercise.tests) {
        try {
          const result = await (await import("@/lib/sandbox")).runInWorker(code, functionName, test.input, {
            timeoutMs: jsTimeoutMs,
            onStep: (line) => {
              try {
                setExecutionState(prev => ({ ...prev, currentLineIndex: Math.max(0, line - 1), logs: [...prev.logs, `▶ line ${line}`] }));
                if (editorRef.current) {
                  const approxLineHeight = 18;
                  editorRef.current.scrollTop = Math.max(0, (line - 3) * approxLineHeight);
                }
              } catch {}
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
        setTestResults([{ passed: false, name: "Error", error: "No function found. Use 'def' to declare your Python function." }]);
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

  const executeLineByLinePython = async () => {
    try {
      const functionNameMatch = code.match(/def\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        toast({
          title: "❌ Error",
          description: "No function found. Use 'def' to declare your function in Python.",
          variant: "destructive",
        });
        return;
      }

      const functionName = functionNameMatch[1];

      // Load Pyodide
      let py: any;
      try {
        py = await getPyodideInstance();
      } catch (e) {
        toast({
          title: "❌ Error loading Python",
          description: "Falha ao carregar o interpretador Python: " + ((e as any).message || String(e)),
          variant: "destructive",
        });
        return;
      }

      const lines = code.split('\n');
      
      setExecutionState({
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
      });

      // Simulate line by line with visual feedback
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().length === 0) continue;
        
        await new Promise(resolve => setTimeout(resolve, executionSpeed));

        const friendlyLog = `⚙️ ${line.trim().substring(0, 60)}${line.trim().length > 60 ? "..." : ""}`;

        setExecutionState(prev => ({
          ...prev,
          currentLineIndex: i + 1,
          logs: [...prev.logs, friendlyLog],
        }));
      }

      // Run tests after execution
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

      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
      }));

    } catch (e) {
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        errorLineIndex: 0,
        errorMessage: (e as any).message,
      }));
      toast({
        title: "❌ Error",
        description: (e as any).message,
        variant: "destructive",
      });
    }
  };

  const executeCompiledLanguage = async () => {
    const lines = code.split('\n');
    
    setExecutionState({
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
    });

    // Visual simulation
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;
      
      await new Promise(resolve => setTimeout(resolve, executionSpeed));

      const friendlyLog = `⚙️ ${line.trim().substring(0, 60)}${line.trim().length > 60 ? "..." : ""}`;

      setExecutionState(prev => ({
        ...prev,
        currentLineIndex: i + 1,
        logs: [...prev.logs, friendlyLog],
      }));
    }

    // Run tests
    await new Promise(resolve => setTimeout(resolve, 500));
    setExecutionState(prev => ({ ...prev, logs: [...prev.logs, "🧪 Running tests..."] }));
    
    runTests();
    
    setTimeout(() => {
      setExecutionState(prev => ({ ...prev, isExecuting: false }));
    }, 1000);
  };

  const executeLineByLine = async () => {
    if (!allowExecution) {
      setPendingExecutionAction("line");
      setShowEnableExecutionConfirm(true);
      return;
    }
    
    // Python: Execute line by line
    if (selectedLanguage === "python") {
      return executeLineByLinePython();
    }
    
    // C, C#, Java: Visual simulation + tests
    if (selectedLanguage === "c" || selectedLanguage === "csharp" || selectedLanguage === "java") {
      return executeCompiledLanguage();
    }
    
    // JavaScript: Execute line by line (default)

    try {
      // Security: Validate code first
      const validation = validateCode(code, "javascript");
      if (!validation.valid) {
        toast({
          title: "🛑 Code Blocked",
          description: validation.error!,
          variant: "destructive",
        });
        setTestResults([{ passed: false, name: "🛑 Security", error: validation.error! }]);
        return;
      }

      const functionNameMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        setTestResults([{ passed: false, name: "Error", error: "No function found. Use 'function' to declare your function." }]);
        return;
      }

      const functionName = functionNameMatch[1];
      
      try {
        new Function(code)();
      } catch (e) {
        setTestResults([{ passed: false, name: "Syntax Error", error: `${(e as any).message}` }]);
        return;
      }

      const lines = code.split('\n');
      
      setExecutionState({
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
      });

      let accumulatedCode = "";
      const variables: Record<string, any> = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().length === 0) continue;
        
        accumulatedCode += line + "\n";
        
        await new Promise(resolve => setTimeout(resolve, executionSpeed));

        try {
          const handler = {
            get(target: any, prop: string) {
              return target[prop];
            },
            set(target: any, prop: string, value: any) {
              target[prop] = value;
              variables[prop] = value;
              return true;
            }
          };

          const scope: any = new Proxy({}, handler);
          const executeCode = `(function() {
            let ${Object.keys(variables).join(" = undefined, ") || "x = 1"};
            ${accumulatedCode}
            return {${Object.keys(variables).join(", ") || "x"}};
          })()`;

          try {
            const result = (new Function(executeCode))();
            Object.assign(variables, result);
          } catch (e) {
            // Variable tracking error, continue
          }

          const stackFrame: StackFrame = {
            id: `frame-${i}`,
            name: functionName,
            active: true,
            variables: Object.entries(variables).map(([name, value]) => ({
              name,
              value: String(value),
              type: typeof value === 'object' ? 'reference' : 'primitive',
              changed: true,
            })),
          };

          const prevVars = { ...variables };
          const friendlyLog = generateFriendlyLog(line, prevVars, variables);

          setExecutionState(prev => ({
            ...prev,
            currentLineIndex: i + 1,
            variables,
            stack: [stackFrame],
            logs: [...prev.logs, friendlyLog],
          }));
        } catch (e) {
          setExecutionState(prev => ({
            ...prev,
            isExecuting: false,
            errorLineIndex: i,
            errorMessage: (e as any).message,
          }));
          return;
        }
      }

      let userFunction: any;
      {
        const getFn = new Function(`${code}; return ${functionName};`);
        userFunction = getFn();
      }
      
      const results = selectedExercise.tests.map((test) => {
        try {
          const result = userFunction(...test.input);
          const passed = JSON.stringify(result) === JSON.stringify(test.expected);
          return {
            name: test.name,
            passed,
            result,
            expected: test.expected,
            error: null,
          };
        } catch (e) {
          return {
            name: test.name,
            passed: false,
            error: (e as any).message,
          };
        }
      });

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

      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
      }));
    } catch (e) {
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        errorLineIndex: 0,
        errorMessage: (e as any).message,
      }));
      setTestResults([{ passed: false, name: "Error", error: `${(e as any).message}` }]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                <span>Challenges</span>
              </h1>
              <p className="text-xs sm:text-base text-slate-300">JS or Python</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 sm:px-4 sm:py-3 flex-shrink-0">
              <p className="text-blue-300 text-xs sm:text-sm font-semibold">Progress</p>
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
              <h3 className="text-sm font-semibold text-white">Exercises</h3>
              <div className="text-xs text-slate-300">Click to Select</div>
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
                <div className="flex gap-3 items-center">
                  <LanguageBadge />
                  <div className="text-sm text-slate-300">Supported: {availableLanguages.join(', ')}</div>
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
                  <span className="font-semibold">Run code</span>
                </label>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
                <TabsTrigger value="code" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Code
                </TabsTrigger>
                <TabsTrigger value="tests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  ✓ Testes ({testResults.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4 mt-6">
                {/* Code Editor */}
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <label className="text-sm font-semibold text-white mb-3 block">Code:</label>
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
                      ref={editorRef}
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
                      className="w-full h-64 md:h-96 p-3 pl-16 font-mono text-sm bg-slate-900 text-slate-50 rounded border border-slate-600 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write your code here..."
                      aria-label={`Code editor (${selectedLanguage})`}
                      spellCheck="false"
                    />
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

                {/* Thin Line Separator */}
                <div className="h-px bg-slate-600"></div>

                {/* Speed Control - Windows Volume Style */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded">
                  <span className="text-xs text-slate-300 font-semibold">🔊</span>
                  <Slider
                    min={50}
                    max={2000}
                    step={50}
                    value={[executionSpeed]}
                    onValueChange={([val]) => setExecutionSpeed(val)}
                    className="flex-1 max-w-xs"
                    aria-label="Execution speed"
                  />
                  <span className="text-xs text-slate-300 font-mono" style={{minWidth: 35, textAlign: 'right'}}>{executionSpeed}ms</span>
                </div>

                {/* Execute Button - Full Width */}
                <Button
                  onClick={executeLineByLine}
                  disabled={executionState.isExecuting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
                >
                  {executionState.isExecuting ? (
                    <>
                      <Play className="w-4 h-4 mr-2 animate-pulse" />
                      Executing
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>

                {/* Below editor: 3 columns - Variables, Memory, Logs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Column 1: Variables */}
                  <Card className="p-4 bg-slate-800 border-slate-700 overflow-auto max-h-64">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">🔵 Variables</h4>
                    <CallStack stack={executionState.stack} />
                  </Card>

                  {/* Column 2: Memory */}
                  <Card className="p-4 bg-slate-800 border-slate-700 overflow-auto max-h-64">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-3">🟢 Memory</h4>
                    <HeapMemory heap={executionState.heap} />
                  </Card>

                  {/* Column 3: What Computer Did */}
                  <Card className="p-4 bg-slate-800 border-slate-700 overflow-auto max-h-64">
                    <h4 className="text-sm font-semibold text-yellow-300 mb-3">⚙️ Executed</h4>
                    {executionState.logs.length === 0 ? (
                      <p className="text-xs text-slate-400">Execute to See Steps</p>
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

                {/* Other Action Buttons */}
                <div className="flex gap-3 flex-wrap">
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
                    disabled={!currentVariant?.hint}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Hint
                  </Button>
                  <Button
                    onClick={() => setShowSolution(!showSolution)}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                </div>

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
                            if (action === "line") executeLineByLine();
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

                {showHint && currentVariant?.hint && (
                  <Card className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500">
                    <p className="text-sm font-semibold text-yellow-300 mb-1">💡 Hint</p>
                    <p className="text-sm text-yellow-200">{currentVariant.hint}</p>
                  </Card>
                )}

                {showSolution && currentVariant && (
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
                  <Card className="p-12 bg-slate-800 border-slate-700 text-center">
                    <p className="text-slate-400 text-lg">Run to see results</p>
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
