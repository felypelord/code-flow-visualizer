import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  X,
  Lightbulb,
  Eye,
  Code2,
  Award,
  BarChart3,
  Zap,
  FileText,
  ChevronDown,
  Pause,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from "@/hooks/use-user";
import { LanguageBadge } from '@/components/language-selector';
import { ProExercise } from "@/lib/pro-exercises";
import { getPyodideInstance } from "@/lib/pyodide";

interface TestResult {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  received: string;
  time: number;
}

interface AttemptHistory {
  id: string;
  timestamp: Date;
  code: string;
  language: string;
  testsCount: number;
  passedCount: number;
}

interface ExecutionState {
  isExecuting: boolean;
  isPaused: boolean;
  currentLineIndex: number;
  lines: string[];
  errorLineIndex: number | null;
  errorMessage: string | null;
  variables: Record<string, any>;
  stack: any[];
  heap: any[];
  logs: string[];
}

interface ProExerciseEditorProps {
  exercise: ProExercise;
  onClose: () => void;
}

export function ProExerciseEditor({ exercise, onClose }: ProExerciseEditorProps) {
  const t: any = {};
  const { user } = useUser();

  // Disable body scroll when editor is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const { progLang } = useLanguage();
  const initialLang = exercise.languages.includes(progLang) ? progLang : (exercise.languages[0] || 'javascript');
  const [language, setLanguage] = useState<string>(initialLang);
  const [code, setCode] = useState(
    exercise.initialCode[initialLang] || exercise.initialCode[exercise.languages[0]] || ""
  );
  const [output, setOutput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [attempts, setAttempts] = useState<AttemptHistory[]>([]);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [executionSpeed, setExecutionSpeed] = useState(300);

  // Update code when language changes
  useEffect(() => {
    const newCode = exercise.initialCode[language] || "";
    setCode(newCode);
    setOutput("");
  }, [language, exercise]);

  // Apply global language change when supported by this exercise
  useEffect(() => {
    if (progLang && exercise.languages.includes(progLang) && progLang !== language) {
      setLanguage(progLang);
    }
  }, [progLang, exercise.languages, language]);

  const stats = useMemo(() => {
    if (testResults.length === 0) return null;
    const passed = testResults.filter((t) => t.passed).length;
    const totalTime = testResults.reduce((acc, t) => acc + (t.time || 0), 0);
    return {
      passed,
      total: testResults.length,
      percentage: Math.round((passed / testResults.length) * 100),
      avgTime: (totalTime / testResults.length).toFixed(2),
    };
  }, [testResults]);

  const executeCode = async () => {
    if (!code.trim()) {
      toast({ title: "⚠️", description: "Write code first", variant: "destructive" });
      return;
    }

    setExecuting(true);
    try {
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

      // Simulate line by line execution with visual feedback
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().length === 0) continue;
        
        await new Promise(resolve => setTimeout(resolve, executionSpeed));

        const friendlyLog = `⚙️ ${line.trim().substring(0, 80)}${line.trim().length > 80 ? "..." : ""}`;

        setExecutionState(prev => prev ? ({
          ...prev,
          currentLineIndex: i + 1,
          logs: [...prev.logs, friendlyLog],
        }) : null);
      }

      // Execute real code if Python or JavaScript
      if (language === "python") {
        await executeLineByLinePython();
      } else if (language === "javascript") {
        executeLineByLineJavaScript();
      }
    } catch (err: any) {
      toast({ title: `❌ Error`, description: String(err?.message || err), variant: "destructive" });
    } finally {
      setExecuting(false);
    }
  };

  const executeLineByLinePython = async () => {
    try {
      const functionNameMatch = code.match(/def\s+(\w+)\s*\(/);
      if (!functionNameMatch) {
        toast({ title: `❌ Syntax Error`, description: "Use 'def' keyword", variant: "destructive" });
        return;
      }

      const functionName = functionNameMatch[1];
      let py: any;
      try {
        py = await getPyodideInstance();
      } catch (e) {
        toast({ title: `❌ Python Load Error`, description: "Failed to load Python", variant: "destructive" });
        return;
      }

      // Run tests
      const results: TestResult[] = [];
      for (const test of exercise.tests) {
        try {
          const inputJSON = JSON.stringify(test.input);
          const script = `${code}\nimport json\n\ndef __run_test():\n  try:\n    val = ${functionName}(*${inputJSON})\n    return json.dumps({'ok': True, 'result': val})\n  except Exception as e:\n    return json.dumps({'ok': False, 'error': str(e)})\n\n__run_test()`;

          const res = await py.runPythonAsync(script);
          const resStr = typeof res === 'string' ? res : String(res);
          const parsed = JSON.parse(resStr);

          if (parsed.ok) {
            const passed = JSON.stringify(parsed.result) === JSON.stringify(test.expected);
            results.push({
              name: test.name,
              passed,
              input: JSON.stringify(test.input),
              expected: JSON.stringify(test.expected),
              received: JSON.stringify(parsed.result),
              time: Math.random() * 100,
            });
          } else {
            results.push({
              name: test.name,
              passed: false,
              input: JSON.stringify(test.input),
              expected: JSON.stringify(test.expected),
              received: "Error: " + parsed.error,
              time: 0,
            });
          }
        } catch (e) {
          results.push({
            name: test.name,
            passed: false,
            input: JSON.stringify(test.input),
            expected: JSON.stringify(test.expected),
            received: "Error: " + String(e),
            time: 0,
          });
        }
      }

      setTestResults(results);
      const passed = results.filter(r => r.passed).length;
      setOutput(passed === results.length ? "All tests passed!" : "Some tests failed.");

      const newAttempt: AttemptHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        code,
        language,
        testsCount: results.length,
        passedCount: results.filter((t) => t.passed).length,
      };
      setAttempts((prev) => [newAttempt, ...prev].slice(0, 10));
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
  };

  const executeLineByLineJavaScript = () => {
    try {
      const results: TestResult[] = [];
      const startTime = performance.now();

      for (const test of exercise.tests) {
        try {
          const testCode = `
            ${code}
            function __test() {
              try {
                const fn = Object.values(this).find(v => typeof v === 'function');
                if (!fn) throw new Error('No function found');
                return fn(...${JSON.stringify(test.input)});
              } catch (e) {
                throw e;
              }
            }
            __test();
          `;

          const result = eval(`(function() { ${testCode} })()`);
          const passed = JSON.stringify(result) === JSON.stringify(test.expected);

          results.push({
            name: test.name,
            passed,
            input: JSON.stringify(test.input),
            expected: JSON.stringify(test.expected),
            received: JSON.stringify(result),
            time: performance.now() - startTime,
          });
        } catch (e) {
          results.push({
            name: test.name,
            passed: false,
            input: JSON.stringify(test.input),
            expected: JSON.stringify(test.expected),
            received: "Error: " + String(e),
            time: performance.now() - startTime,
          });
        }
      }

      setTestResults(results);
      const passed = results.filter(r => r.passed).length;
      setOutput(passed === results.length ? "All tests passed!" : "Some tests failed.");

      const newAttempt: AttemptHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        code,
        language,
        testsCount: results.length,
        passedCount: results.filter((t) => t.passed).length,
      };
      setAttempts((prev) => [newAttempt, ...prev].slice(0, 10));
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
  };

  const getAiHint = async () => {
    setAiHintLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "💡 AI Hint",
        description: exercise.hint || "Try using a different approach",
      });
    } finally {
      setAiHintLoading(false);
    }
  };

  const resetCode = () => {
    const newCode = exercise.initialCode[language] || exercise.initialCode[exercise.languages[0]] || "";
    setCode(newCode);
    setTestResults([]);
    setOutput("");
    setExecutionState(null);
  };

  const getLanguageName = (lang: string) => {
    const names: Record<string, string> = {
      javascript: "JavaScript",
      python: "Python",
      c: "C",
      csharp: "C#",
      java: "Java",
    };
    return names[lang] || lang;
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/70 z-30" onClick={onClose} />
      {/* Editor container */}
      <div className="fixed inset-0 top-16 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 z-40 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-200 text-xs font-semibold">
              <Code2 className="w-4 h-4" />
              {exercise.difficulty === "Advanced"
                ? "🔴"
                : exercise.difficulty === "Intermediate"
                  ? "🟡"
                  : "🟢"} 
              {exercise.difficulty.toUpperCase()}
            </div>
            <h1 className="text-4xl font-bold text-white">{exercise.title}</h1>
            <p className="text-purple-100/80 text-lg">{exercise.description}</p>
            <div className="flex gap-4 text-sm text-purple-200/70 pt-2">
              <span>⏱️ {exercise.estimatedTime}m</span>
              <span>📂 {exercise.category}</span>
              <span>⭐ +{exercise.points || 50} XP</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Code Editor */}
          <div className="xl:col-span-2 space-y-4">
            {/* Language Indicator (read-only) */}
            <div className="flex gap-4 flex-wrap items-center">
              <LanguageBadge compact />
              <div className="flex items-center gap-2 text-sm text-purple-200/70">
                <span className="text-xs">Supported:</span>
                {exercise.languages.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs">
                    {getLanguageName(l)}
                  </span>
                ))}
              </div>
            </div>

            {/* Code Editor */}
            <Card className="p-4 bg-gradient-to-b from-slate-900/50 to-slate-950 border border-purple-400/20">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 p-4 bg-black/60 text-purple-50 border border-purple-500/30 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                placeholder="Write code first"
              />
            </Card>

            {/* Controls */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={executeCode}
                disabled={executing}
                className="bg-gradient-to-r from-purple-400 to-purple-600 text-black font-semibold hover:from-purple-500 hover:to-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {executing ? "Executing..." : "Execute"}
              </Button>
              <Button onClick={resetCode} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={() => setShowSolution(!showSolution)}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Solution
              </Button>
              <Button
                onClick={getAiHint}
                disabled={aiHintLoading}
                variant="outline"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </Button>
            </div>

            {/* Solution Display */}
            {showSolution && (
              <Card className="p-4 bg-gradient-to-b from-amber-900/20 to-slate-900 border border-amber-400/30">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-amber-100">Solution</h3>
                </div>
                <pre className="bg-black/60 p-3 rounded border border-amber-500/20 text-amber-50 text-sm overflow-x-auto font-mono">
                  {exercise.solution?.[language] || exercise.solution?.javascript}
                </pre>
                <p className="text-xs text-amber-200/70 mt-2">
                  📝 Study the official solution and compare with your code
                </p>
              </Card>
            )}
          </div>

          {/* Right: Tests & Stats */}
          <div className="space-y-4">
            <Tabs defaultValue="tests" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-purple-400/20">
                <TabsTrigger value="tests">Tests</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Tests Tab */}
              <TabsContent value="tests" className="space-y-3 mt-3">
                {testResults.length === 0 ? (
                  <Card className="p-6 bg-black/40 border border-purple-400/20 text-center">
                    <p className="text-purple-200/70 text-sm">
                      Run to see results
                    </p>
                  </Card>
                ) : (
                  testResults.map((test, idx) => (
                    <Card
                      key={idx}
                      className={`p-3 border ${
                        test.passed
                          ? "bg-green-500/10 border-green-400/30"
                          : "bg-red-500/10 border-red-400/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {test.passed ? (
                          <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm ${
                              test.passed
                                ? "text-green-100"
                                : "text-red-100"
                            }`}
                          >
                            {test.name}
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            ⏱️ {test.time.toFixed(0)}ms
                          </p>
                          {!test.passed && (
                            <div className="text-xs text-gray-200 mt-2 space-y-1">
                              <p>
                                <strong>Expected:</strong> 
                                <code className="bg-black/40 px-1 rounded">
                                  {test.expected}
                                </code>
                              </p>
                              <p>
                                <strong>Received:</strong> 
                                <code className="bg-black/40 px-1 rounded">
                                  {test.received}
                                </code>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-3 mt-3">
                {stats ? (
                  <>
                    <Card className="p-4 bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-400/30">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-200">Success Rate</span>
                          <span className="text-2xl font-bold text-purple-400">
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-purple-200/70">
                          {stats.passed}/{stats.total} Tests
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 bg-black/30 border border-purple-400/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-200">Average Time</span>
                        <span className="font-mono text-purple-100">
                          {stats.avgTime}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-200">Attempts</span>
                        <span className="font-semibold text-purple-400">
                          {attempts.length}
                        </span>
                      </div>
                    </Card>

                    {stats.percentage === 100 && (
                      <Card className="p-4 bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-400/30">
                        <div className="flex items-center gap-2 text-green-100">
                          <Award className="w-5 h-5" />
                          <span className="font-semibold">🎉 Congrats! Challenge Completed!</span>
                        </div>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="p-6 bg-black/40 border border-purple-400/20 text-center">
                    <p className="text-purple-200/70 text-sm">No statistics yet</p>
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-2 mt-3 max-h-80 overflow-y-auto">
                {attempts.length === 0 ? (
                  <Card className="p-6 bg-black/40 border border-purple-400/20 text-center">
                    <p className="text-purple-200/70 text-sm">No attempts yet</p>
                  </Card>
                ) : (
                  attempts.map((attempt) => (
                    <Card
                      key={attempt.id}
                      className={`p-3 cursor-pointer transition hover:border-purple-300 ${
                        attempt.passedCount === attempt.testsCount
                          ? "bg-green-500/10 border-green-400/30"
                          : "bg-purple-500/10 border-purple-400/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {attempt.passedCount === attempt.testsCount ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Zap className="w-4 h-4 text-yellow-400" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {attempt.timestamp.toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-300">
                              {attempt.language} • {attempt.passedCount}/{attempt.testsCount} Tests
                            </p>
                          </div>
                        </div>
                        <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Execution Visualization */}
            {executionState && (
              <Card className="p-4 bg-gradient-to-b from-slate-900/60 to-black/40 border border-green-400/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-green-100">Real-time Execution</h3>
                  </div>
                  <div className="text-xs text-green-200/70">
                    Line: {executionState.currentLineIndex + 1}/{executionState.lines.length}
                  </div>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {executionState.logs.map((log, idx) => (
                    <div key={idx} className="text-xs text-green-100/80 font-mono flex items-center gap-2">
                      <span className="text-green-400">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                {executionState.logs.length === 0 && (
                  <p className="text-xs text-green-200/50 italic">Waiting for execution...</p>
                )}
              </Card>
            )}

            {/* Output */}
            {output && (
              <Card className="p-3 bg-black/60 border border-purple-400/20">
                <p className="text-xs text-purple-200/70 mb-2">📤 Output:</p>
                <pre className="text-xs text-purple-100 font-mono overflow-x-auto">
                  {output}
                </pre>
              </Card>
            )}
          </div>
        </div>

        {/* Resources Section */}
        <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-purple-900/20 border border-purple-400/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Description
              </h3>
              <p className="text-purple-100/80 text-sm leading-relaxed">
                {exercise.description}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Complexity
              </h3>
              <div className="space-y-1 text-sm text-purple-100/80">
                <p>
                  <strong>Time:</strong> O({exercise.complexity?.time || "n"})
                </p>
                <p>
                  <strong>Space:</strong> O({exercise.complexity?.space || "1"})
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </>
  );
}
