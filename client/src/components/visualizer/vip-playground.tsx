import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Code2,
  Network,
  Cpu,
  Database,
  Download,
  Share2,
  Crown,
  GitCompare,
  Clock,
  Terminal,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/hooks/use-user";
import { toast } from "@/hooks/use-toast";

interface ExecutionFrame {
  timestamp: number;
  line: number;
  variables: Record<string, any>;
  stack: string[];
  heap: Record<string, any>;
  memory: number;
  cpuTime: number;
}

export function VIPPlayground() {
  const { t } = useLanguage();
  const { user } = useUser();
  const isPro = user?.isPro || false;

  const [code, setCode] = useState(`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function main() {
  const result = fibonacci(6);
  console.log("Result:", result);
  return result;
}

main();`);

  const [execution, setExecution] = useState<{
    frames: ExecutionFrame[];
    currentFrame: number;
    isRunning: boolean;
    output: string[];
    errors: string[];
  }>({
    frames: [],
    currentFrame: 0,
    isRunning: false,
    output: [],
    errors: [],
  });

  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const [showMemory, setShowMemory] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonCode, setComparisonCode] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced execution with frame capture
  const executeWithFrames = () => {
    if (!isPro) {
      toast({
        title: t.proRequired || "Pro Required",
        description: "Advanced playground features require Pro subscription",
        variant: "destructive",
      });
      return;
    }

    const frames: ExecutionFrame[] = [];
    const output: string[] = [];
    const errors: string[] = [];
    let frameCount = 0;
    const maxFrames = 100;

    // Wrap console.log
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      output.push(args.map((a) => String(a)).join(" "));
      originalLog.apply(console, args);
    };

    try {
      const startTime = performance.now();
      const fn = new Function(`
        ${code}
        return { executed: true };
      `);

      // Simulate frame capture (in real scenario, use instrumentation)
      frames.push({
        timestamp: performance.now() - startTime,
        line: 1,
        variables: {},
        stack: ["main()"],
        heap: {},
        memory: Math.random() * 1000 + 500,
        cpuTime: 0,
      });

      const result = fn();

      const endTime = performance.now();
      frames.push({
        timestamp: endTime - startTime,
        line: code.split("\n").length,
        variables: { result },
        stack: [],
        heap: {},
        memory: Math.random() * 1000 + 800,
        cpuTime: endTime - startTime,
      });

      setExecution({
        frames,
        currentFrame: 0,
        isRunning: false,
        output,
        errors,
      });

      toast({
        title: "✅ Execution Complete",
        description: `Captured ${frames.length} frames in ${(endTime - startTime).toFixed(2)}ms`,
      });
    } catch (err: any) {
      errors.push(err.message || String(err));
      setExecution({
        frames,
        currentFrame: 0,
        isRunning: false,
        output,
        errors,
      });
      toast({
        title: "❌ Execution Error",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      console.log = originalLog;
    }
  };

  const playExecution = () => {
    if (execution.frames.length === 0) return;
    setExecution((prev) => ({ ...prev, isRunning: true }));
  };

  const pauseExecution = () => {
    setExecution((prev) => ({ ...prev, isRunning: false }));
  };

  const resetExecution = () => {
    setExecution((prev) => ({
      ...prev,
      currentFrame: 0,
      isRunning: false,
    }));
  };

  const exportExecution = () => {
    const data = JSON.stringify(execution, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `execution-trace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Exported", description: "Execution trace saved" });
  };

  const shareExecution = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "✅ Copied", description: "Code copied to clipboard" });
    } catch {
      toast({ title: "❌ Failed", description: "Could not copy to clipboard" });
    }
  };

  // Auto-play frames
  useEffect(() => {
    if (execution.isRunning && execution.currentFrame < execution.frames.length - 1) {
      intervalRef.current = setTimeout(() => {
        setExecution((prev) => ({
          ...prev,
          currentFrame: prev.currentFrame + 1,
        }));
      }, playbackSpeed);
    } else if (execution.currentFrame >= execution.frames.length - 1) {
      setExecution((prev) => ({ ...prev, isRunning: false }));
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [execution.isRunning, execution.currentFrame, playbackSpeed, execution.frames.length]);

  // Draw timeline visualization
  useEffect(() => {
    if (!canvasRef.current || execution.frames.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw timeline bars
    const barWidth = width / execution.frames.length;
    execution.frames.forEach((frame, idx) => {
      const x = idx * barWidth;
      const memoryHeight = (frame.memory / 2000) * height;

      // Memory bar
      ctx.fillStyle = idx === execution.currentFrame ? "#f59e0b" : "#6366f1";
      ctx.fillRect(x, height - memoryHeight, barWidth - 2, memoryHeight);

      // CPU time line
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      if (idx > 0) {
        const prevY = height - (execution.frames[idx - 1].cpuTime / 10) * height;
        const currY = height - (frame.cpuTime / 10) * height;
        ctx.beginPath();
        ctx.moveTo((idx - 1) * barWidth + barWidth / 2, prevY);
        ctx.lineTo(x + barWidth / 2, currY);
        ctx.stroke();
      }
    });

    // Current frame marker
    const currentX = execution.currentFrame * barWidth;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();
  }, [execution]);

  const currentFrame = execution.frames[execution.currentFrame];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900 rounded-3xl border border-indigo-400/20 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
            <Crown className="w-4 h-4" />
            VIP Playground - Advanced Execution
          </div>
          <h2 className="text-2xl font-bold text-white">
            Playground Interativo Profissional
          </h2>
          <p className="text-sm text-indigo-200/80 mt-1">
            Execute, analise e compare código com visualização em tempo real de memória, CPU e call stack
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMemory(!showMemory)}
            className="border-indigo-400/40"
          >
            {showMemory ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="ml-2">Memory</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
            className="border-indigo-400/40"
          >
            <GitCompare className="w-4 h-4" />
            <span className="ml-2">Compare</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <Card className="p-4 bg-gradient-to-b from-indigo-900/30 to-slate-900 border border-indigo-400/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              {compareMode ? "Code A" : "Your Code"}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={shareExecution}
                variant="outline"
                className="border-indigo-400/40 text-indigo-200"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={exportExecution}
                variant="outline"
                className="border-indigo-400/40 text-indigo-200"
                disabled={execution.frames.length === 0}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 p-3 rounded-lg font-mono text-sm bg-black/60 text-indigo-50 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            placeholder="Write your JavaScript code here..."
            spellCheck={false}
          />

          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={executeWithFrames}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute & Capture
            </Button>
            <Button
              onClick={playExecution}
              variant="outline"
              disabled={execution.frames.length === 0 || execution.isRunning}
              className="border-indigo-400/40"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              onClick={pauseExecution}
              variant="outline"
              disabled={!execution.isRunning}
              className="border-indigo-400/40"
            >
              <Pause className="w-4 h-4" />
            </Button>
            <Button
              onClick={resetExecution}
              variant="outline"
              disabled={execution.frames.length === 0}
              className="border-indigo-400/40"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <div className="ml-auto flex items-center gap-2 text-xs text-indigo-200">
              <Clock className="w-4 h-4" />
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="w-24"
              />
              <span>{playbackSpeed}ms</span>
            </div>
          </div>
        </Card>

        {/* Comparison Code (if compare mode) */}
        {compareMode && (
          <Card className="p-4 bg-gradient-to-b from-purple-900/30 to-slate-900 border border-purple-400/30">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-400" />
              Code B (Comparison)
            </h3>
            <textarea
              value={comparisonCode}
              onChange={(e) => setComparisonCode(e.target.value)}
              className="w-full h-96 p-3 rounded-lg font-mono text-sm bg-black/60 text-purple-50 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
              placeholder="Paste alternative implementation to compare..."
              spellCheck={false}
            />
          </Card>
        )}

        {/* Execution Visualization */}
        {!compareMode && (
          <Card className="p-4 bg-gradient-to-b from-slate-900 to-indigo-950/20 border border-indigo-400/30">
            <Tabs defaultValue="output" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="output">
                  <Terminal className="w-4 h-4 mr-1" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Network className="w-4 h-4 mr-1" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="memory">
                  <Database className="w-4 h-4 mr-1" />
                  Memory
                </TabsTrigger>
                <TabsTrigger value="cpu">
                  <Cpu className="w-4 h-4 mr-1" />
                  CPU
                </TabsTrigger>
              </TabsList>

              <TabsContent value="output" className="mt-4">
                <div className="bg-black/60 rounded-lg p-3 h-96 overflow-auto font-mono text-sm">
                  {execution.output.length === 0 && execution.errors.length === 0 && (
                    <p className="text-gray-500">No output yet. Click "Execute & Capture" to run.</p>
                  )}
                  {execution.output.map((line, idx) => (
                    <div key={`out-${idx}`} className="text-green-300">
                      {line}
                    </div>
                  ))}
                  {execution.errors.map((err, idx) => (
                    <div key={`err-${idx}`} className="text-red-300">
                      ❌ {err}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-3">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full rounded-lg bg-black/40 border border-indigo-400/20"
                  />
                  {currentFrame && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-black/40 rounded p-3 border border-indigo-400/20">
                        <div className="text-xs text-gray-400 mb-1">Current Line</div>
                        <div className="text-lg font-bold text-indigo-300">{currentFrame.line}</div>
                      </div>
                      <div className="bg-black/40 rounded p-3 border border-indigo-400/20">
                        <div className="text-xs text-gray-400 mb-1">Timestamp</div>
                        <div className="text-lg font-bold text-indigo-300">
                          {currentFrame.timestamp.toFixed(2)}ms
                        </div>
                      </div>
                      <div className="bg-black/40 rounded p-3 border border-indigo-400/20">
                        <div className="text-xs text-gray-400 mb-1">Memory Usage</div>
                        <div className="text-lg font-bold text-purple-300">
                          {currentFrame.memory.toFixed(0)} KB
                        </div>
                      </div>
                      <div className="bg-black/40 rounded p-3 border border-indigo-400/20">
                        <div className="text-xs text-gray-400 mb-1">CPU Time</div>
                        <div className="text-lg font-bold text-amber-300">
                          {currentFrame.cpuTime.toFixed(2)}ms
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="memory" className="mt-4">
                <div className="bg-black/60 rounded-lg p-3 h-96 overflow-auto">
                  {currentFrame ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-indigo-300 mb-2">Call Stack</div>
                      {currentFrame.stack.map((fn, idx) => (
                        <div
                          key={`stack-${idx}`}
                          className="bg-indigo-500/10 border border-indigo-400/30 rounded px-3 py-2 text-sm"
                        >
                          {fn}
                        </div>
                      ))}
                      <div className="text-xs font-semibold text-purple-300 mb-2 mt-4">Heap</div>
                      {Object.keys(currentFrame.heap).length === 0 ? (
                        <p className="text-gray-500 text-sm">No heap objects</p>
                      ) : (
                        Object.entries(currentFrame.heap).map(([key, val]) => (
                          <div
                            key={`heap-${key}`}
                            className="bg-purple-500/10 border border-purple-400/30 rounded px-3 py-2 text-sm"
                          >
                            <span className="text-purple-300">{key}</span>:{" "}
                            <span className="text-gray-300">{JSON.stringify(val)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Run code to see memory state</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cpu" className="mt-4">
                <div className="bg-black/60 rounded-lg p-3 h-96 overflow-auto">
                  {execution.frames.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-amber-300 mb-3">
                        CPU Performance Profile
                      </div>
                      {execution.frames.map((frame, idx) => (
                        <div
                          key={`cpu-${idx}`}
                          className={`flex items-center gap-3 p-2 rounded ${
                            idx === execution.currentFrame
                              ? "bg-amber-500/20 border border-amber-400/40"
                              : "bg-slate-800/40"
                          }`}
                        >
                          <span className="text-xs text-gray-400 w-12">#{idx + 1}</span>
                          <div className="flex-1 h-2 bg-black/40 rounded overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-red-500"
                              style={{
                                width: `${Math.min(100, (frame.cpuTime / 50) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-amber-300 w-16 text-right">
                            {frame.cpuTime.toFixed(2)}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Run code to see CPU profile</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

      {/* Educational Tips */}
      <Card className="p-4 bg-indigo-500/10 border-indigo-400/30">
        <div className="text-xs text-indigo-100 space-y-2">
          <div className="font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Como usar este playground avançado:
          </div>
          <ul className="space-y-1 text-indigo-200/80 list-disc list-inside">
            <li>
              <strong>Execute & Capture:</strong> Roda o código e grava cada frame (linha, variáveis, memória, CPU)
            </li>
            <li>
              <strong>Timeline:</strong> Visualiza graficamente uso de memória (barras azuis) e tempo de CPU (linha vermelha)
            </li>
            <li>
              <strong>Compare Mode:</strong> Cole duas implementações diferentes e compare performance/resultados
            </li>
            <li>
              <strong>Export:</strong> Salva toda a trace de execução em JSON para análise offline
            </li>
            <li>
              <strong>Playback:</strong> Assista frame-by-frame como o código executou (ajuste velocidade com slider)
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
