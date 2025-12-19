import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw, SkipForward, SkipBack, Download, Flag, Clock3, Copy, Sparkles, Lock, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import CallStack from "./call-stack";
import HeapMemory from "./heap-memory";

// Placeholder para Pyodide - vai carregar lazy
let getPyodideInstance: any = null;
let pyodideError = false;

const initPyodide = async () => {
  if (pyodideError) throw new Error("Pyodide falhou ao carregar");
  if (!getPyodideInstance) {
    try {
      const module = await import("@/lib/pyodide");
      getPyodideInstance = module.getPyodideInstance;
    } catch (err) {
      pyodideError = true;
      throw new Error("Nao foi possivel carregar Pyodide");
    }
  }
  return getPyodideInstance();
};

interface ExecutionFrame {
  line: number;
  function: string;
  locals: Record<string, any>;
  stack: string[];
  heap: Array<{id: string; className: string; properties: Array<{name: string; value: any}>}>;
  timestamp: number;
}

interface DebuggerState {
  isRunning: boolean;
  isPaused: boolean;
  currentFrame: number;
  frames: ExecutionFrame[];
  output: string[];
  error: string | null;
}

interface Breakpoint {
  line: number;
  condition?: string;
}

export function ProDebugger() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const isPro = user?.isPro || false;

  const [profilerUsageCount, setProfilerUsageCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem('profiler-usage') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [debugState, setDebugState] = useState<DebuggerState>({
    isRunning: false,
    isPaused: false,
    currentFrame: 0,
    frames: [],
    output: [],
    error: null,
  });

  const [code, setCode] = useState(`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def main():
    numeros = [1, 2, 3, 4, 5]
    total = 0
    resultados = {}
    for i in numeros:
        resultado = factorial(i)
        resultados[i] = resultado
        total += resultado
    print(f"Total: {total}")

main()`);

  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([{ line: 10, condition: "total > 50" }]);
  const [watchList, setWatchList] = useState<string[]>(["total", "i", "numeros", "resultados"]);
  const [profilerRuns, setProfilerRuns] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('pro-debugger-profiler');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const evalCondition = (cond: string, locals: Record<string, any>) => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(locals), `return ${cond}`);
      return !!fn(...Object.values(locals));
    } catch {
      return false;
    }
  };

  // Executar codigo com rastreamento
  const executeWithDebug = async () => {
    try {
      setDebugState((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        frames: [],
        output: [],
        error: null,
      }));

      const pyodide = await initPyodide();

      // Usar exec com globals para evitar injecao de codigo
      const setup = `
import sys
import io
from contextlib import redirect_stdout

frames = []
output = []
call_stack = []
heap_objects = {}
object_counter = 0

def extract_heap():
    global heap_objects, object_counter
    heap = []
    for obj_id, obj_data in heap_objects.items():
        heap.append({
            'id': obj_id,
            'className': obj_data['className'],
            'properties': obj_data['properties']
        })
    return heap

def track_object(obj, var_name=''):
    global object_counter, heap_objects
    if isinstance(obj, (list, dict, set, tuple)) and len(str(obj)) < 500:
        obj_id = f"obj_{object_counter}"
        object_counter += 1
        
        if isinstance(obj, list):
            props = [{'name': f'[{i}]', 'value': repr(v)[:50]} for i, v in enumerate(obj[:10])]
            heap_objects[obj_id] = {'className': 'list', 'properties': props}
        elif isinstance(obj, dict):
            props = [{'name': str(k), 'value': repr(v)[:50]} for k, v in list(obj.items())[:10]]
            heap_objects[obj_id] = {'className': 'dict', 'properties': props}
        elif isinstance(obj, set):
            props = [{'name': f'{i}', 'value': repr(v)[:50]} for i, v in enumerate(list(obj)[:10])]
            heap_objects[obj_id] = {'className': 'set', 'properties': props}
        elif isinstance(obj, tuple):
            props = [{'name': f'[{i}]', 'value': repr(v)[:50]} for i, v in enumerate(obj[:10])]
            heap_objects[obj_id] = {'className': 'tuple', 'properties': props}
        return obj_id
    return None

def trace_calls(frame, event, arg):
    global call_stack, heap_objects
    if event == 'call':
        call_stack.append(frame.f_code.co_name)
    elif event == 'return':
        if call_stack:
            call_stack.pop()
    elif event == 'line':
        local_vars = {}
        heap_objects = {}
        
        for k, v in frame.f_locals.items():
            try:
                track_object(v, k)
                local_vars[k] = repr(v)[:120]
            except:
                local_vars[k] = '<objeto>'
        
        frames.append({
            'line': frame.f_lineno,
            'function': frame.f_code.co_name,
            'locals': local_vars,
            'stack': list(call_stack),
            'heap': extract_heap(),
            'timestamp': len(frames)
        })
    return trace_calls

output_buffer = io.StringIO()
`;

      pyodide.runPython(setup);

      // Preparar o codigo do usuario com indentacao adequada
      const userCode = code
        .split('\n')
        .map(line => '    ' + line)
        .join('\n');

      const execution = `
sys.settrace(trace_calls)
with redirect_stdout(output_buffer):
${userCode}
sys.settrace(None)
output = output_buffer.getvalue().split('\\n')
`;

      try {
        pyodide.runPython(execution);
      } catch (execErr: any) {
        setDebugState((prev) => ({
          ...prev,
          isRunning: false,
          error: `Erro na execucao: ${execErr.message || String(execErr)}`,
        }));
        return;
      }

      const framesData = pyodide.globals.get("frames");
      const outputData = pyodide.globals.get("output");

      const frames = framesData ? framesData.toJs() : [];
      const outputLines = outputData ? outputData.toJs() : [];

      let initialFrame = 0;
      const bpHit = frames.findIndex((f: any) => breakpoints.some(bp => bp.line === f.line && (!bp.condition || evalCondition(bp.condition, f.locals))));
      if (bpHit >= 0) initialFrame = bpHit;

      setDebugState((prev) => ({
        ...prev,
        isRunning: false,
        frames: frames || [],
        output: outputLines.filter((line: string) => line.trim()) || [],
        currentFrame: initialFrame,
      }));
    } catch (err: any) {
      setDebugState((prev) => ({
        ...prev,
        isRunning: false,
        error: `Erro ao carregar Pyodide: ${err.message || String(err)}`,
      }));
      console.error("[ProDebugger] Error:", err);
    }
  };

  const currentFrame = debugState.frames[debugState.currentFrame];
  const callStackData = useMemo(() => {
    const stack = currentFrame?.stack || [];
    return stack.map((name: string, index: number, arr: string[]) => ({
      id: `${index}-${name}`,
      name,
      variables: [],
      active: index === arr.length - 1,
    }));
  }, [currentFrame]);

  const currentWatches = useMemo(() => {
    if (!currentFrame) return [] as Array<{ name: string; value: string }>;
    return watchList.map((w) => ({ name: w, value: String(currentFrame.locals?.[w] ?? "<indefinido>") }));
  }, [currentFrame, watchList]);

  const handleAddBreakpoint = () => {
    const last = breakpoints[breakpoints.length - 1];
    const nextLine = (last?.line || 1) + 1;
    setBreakpoints([...breakpoints, { line: nextLine }]);
  };

  const handleRunProfiler = async () => {
    if (!isPro && profilerUsageCount >= 1) {
      toast({
        title: t.proRequired || "Pro Required",
        description: t.profilerLimit || "You've used your free profiler run. Upgrade to Pro for unlimited access.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pyodide = await initPyodide();
      const runs: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        pyodide.runPython(code);
        const end = performance.now();
        runs.push(Number((end - start).toFixed(2)));
      }
      setProfilerRuns(runs);
      localStorage.setItem('pro-debugger-profiler', JSON.stringify(runs));

      if (!isPro) {
        const newCount = profilerUsageCount + 1;
        setProfilerUsageCount(newCount);
        localStorage.setItem('profiler-usage', newCount.toString());
      }

      const avg = (runs.reduce((a, b) => a + b, 0) / runs.length).toFixed(2);
      const min = Math.min(...runs).toFixed(2);
      const max = Math.max(...runs).toFixed(2);
      toast({ 
        title: t.profilerComplete || "Profiler Complete", 
        description: `${t.average || "Average"}: ${avg}ms | ${t.min || "Min"}: ${min}ms | ${t.max || "Max"}: ${max}ms` 
      });
    } catch (err: any) {
      toast({ title: t.profilerError || "Profiler Error", description: err?.message || String(err) });
    }
  };

  const handleExport = () => {
    const payload = {
      frames: debugState.frames,
      output: debugState.output,
      code,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pro-debugger-snapshot.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Snapshot exportado" });
  };

  const handleCopy = async () => {
    const payload = {
      frames: debugState.frames,
      output: debugState.output,
      code,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast({ title: "Snapshot copiado" });
  };

  const runToEnd = () => {
    setDebugState((prev) => ({ ...prev, currentFrame: Math.max(prev.frames.length - 1, 0) }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 bg-slate-900/60 rounded-3xl border border-slate-700 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-semibold w-fit">
          <Sparkles className="w-4 h-4" /> Pro Debugger - Passo a passo + Snapshots
        </div>
        <h1 className="text-3xl font-bold text-white">Visual Debugger Dourado</h1>
        <p className="text-sm text-amber-100/90">Breakpoints condicionais, watch de variaveis, pilha de chamadas, output, export e profiler.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl shadow-sm xl:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Codigo</h2>
            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={executeWithDebug} disabled={debugState.isRunning}>
                <Play className="w-4 h-4" /> Executar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDebugState((prev) => ({ ...prev, currentFrame: 0, frames: [], output: [], error: null }))}>
                <RotateCcw className="w-4 h-4" /> Resetar
              </Button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-72 p-3 border rounded-lg font-mono text-sm bg-black/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            placeholder="Escreva seu codigo Python aqui..."
          />

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Card className="p-3 bg-black/30 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Flag className="w-4 h-4" /> Breakpoints</span>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={handleAddBreakpoint}>+ linha</Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {breakpoints.map((bp, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      value={bp.line}
                      onChange={(e) => {
                        const next = [...breakpoints];
                        next[idx] = { ...bp, line: Number(e.target.value) };
                        setBreakpoints(next);
                      }}
                      className="w-16 bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="condicao opcional"
                      value={bp.condition || ""}
                      onChange={(e) => {
                        const next = [...breakpoints];
                        next[idx] = { ...bp, condition: e.target.value };
                        setBreakpoints(next);
                      }}
                      className="flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                ))}
                {breakpoints.length === 0 && <div className="text-slate-300 text-xs">Nenhum breakpoint.</div>}
              </div>
            </Card>

            <Card className="p-3 bg-black/30 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Watch</span>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={() => setWatchList((prev) => [...prev, "novaVar"])}>+ var</Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {watchList.map((w, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <input
                      value={w}
                      onChange={(e) => {
                        const next = [...watchList];
                        next[idx] = e.target.value;
                        setWatchList(next);
                      }}
                      className="flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                    <span className="text-amber-300 font-mono">{currentFrame ? String(currentFrame.locals?.[w] ?? "-") : "-"}</span>
                  </div>
                ))}
                {watchList.length === 0 && <div className="text-slate-300 text-xs">Sem watch.</div>}
              </div>
            </Card>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl shadow-sm xl:col-span-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Estado da Execucao</h2>
              <p className="text-xs text-amber-100/80">Navegue por passos, stack e output; exporte snapshot.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={handleExport}><Download className="w-4 h-4" /> Exportar JSON</Button>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={handleCopy}><Copy className="w-4 h-4" /> Copiar snapshot</Button>
            </div>
          </div>

          <Tabs defaultValue="variables" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-slate-700">
              <TabsTrigger value="variables">Variaveis</TabsTrigger>
              <TabsTrigger value="stack">Stack</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="heap">Heap</TabsTrigger>
            </TabsList>

            <TabsContent value="variables" className="space-y-2 mt-3 relative">
              {!isPro && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                  <Card className="p-6 bg-slate-900/90 border border-slate-700 shadow-xl max-w-sm text-center">
                    <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h4 className="text-xl font-bold text-white mb-2">{t.proFeature || "Pro Feature"}</h4>
                    <p className="text-amber-100/80 text-sm mb-4">
                      {t.variableInspectorPro || "Variable Inspector is available for Pro users only."}
                    </p>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      onClick={() => setLocation("/pro")}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {t.upgradeToPro || "Upgrade to Pro"}
                    </Button>
                  </Card>
                </div>
              )}
              {currentFrame ? (
                <div className="space-y-3 bg-black/40 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>📍 Linha {currentFrame.line} em <span className="font-mono">{currentFrame.function}()</span></span>
                    <span className="text-xs text-amber-200/80">Passo {debugState.currentFrame + 1} / {debugState.frames.length}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {Object.entries(currentFrame.locals || {}).map(([key, value]) => (
                      <div key={key} className="text-sm font-mono flex justify-between bg-slate-900/80 p-2 rounded border border-slate-700 text-slate-200">
                        <span className="font-semibold text-blue-300">{key}</span>
                        <span className="text-slate-100 truncate">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  {Object.keys(currentFrame.locals || {}).length === 0 && (
                    <p className="text-sm text-slate-300">Sem variaveis locais</p>
                  )}

                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-200 mb-2">Watch</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {currentWatches.map((w) => (
                        <div key={w.name} className="flex items-center justify-between text-sm font-mono bg-black/40 border border-slate-700 rounded px-2 py-1 text-slate-200">
                          <span className="text-blue-300">{w.name}</span>
                          <span>{w.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-300">Execute o codigo para ver variaveis</p>
              )}
            </TabsContent>

            <TabsContent value="stack" className="mt-3">
              <div className="bg-black/40 border border-slate-700 rounded-lg p-3 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-amber-100 mb-2">Timeline de passos</div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {debugState.frames.map((frame, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDebugState((prev) => ({ ...prev, currentFrame: idx }))}
                        className={`w-full text-left text-xs p-2 rounded font-mono transition ${idx === debugState.currentFrame ? "bg-blue-600 text-white" : "bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-slate-800"}`}
                      >
                        L{frame.line} {frame.function}()
                        {frame.stack && frame.stack.length > 0 && <span className="ml-2 text-slate-300">[{frame.stack.join(" » ")}]</span>}
                      </button>
                    ))}
                    {debugState.frames.length === 0 && <div className="text-xs text-slate-300">Sem passos.</div>}
                  </div>
                </div>
                <div className="border-l border-slate-700 pl-3">
                  <CallStack stack={callStackData} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output" className="mt-3">
              <div className="bg-black/40 border border-slate-700 rounded-lg p-3 font-mono text-sm h-48 overflow-y-auto">
                {debugState.output && debugState.output.length > 0 ? (
                  <div className="space-y-1 text-slate-200">
                    {debugState.output.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-300">{debugState.frames.length > 0 ? "Nenhum output" : "Execute para ver output"}</p>
                )}
                {debugState.error && (
                  <div className="text-red-400 mt-2 font-semibold">❌ {debugState.error}</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="heap" className="mt-3">
              <div className="bg-black/40 border border-slate-700 rounded-lg p-3">
                <HeapMemory heap={(currentFrame?.heap || []).map((obj, idx) => ({
                  id: obj.id,
                  className: obj.className,
                  properties: obj.properties.map(p => ({ 
                    name: p.name, 
                    value: p.value, 
                    type: typeof p.value === 'object' && p.value !== null ? 'reference' as const : 'primitive' as const,
                    changed: false 
                  })),
                  highlight: idx === 0
                }))} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDebugState((prev) => ({ ...prev, currentFrame: 0 }))} disabled={debugState.currentFrame === 0}>
              <SkipBack className="w-4 h-4" /> Inicio
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDebugState((prev) => ({ ...prev, currentFrame: Math.max(0, prev.currentFrame - 1) }))} disabled={debugState.currentFrame === 0}>
              Passo ←
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDebugState((prev) => ({ ...prev, currentFrame: Math.min(prev.frames.length - 1, prev.currentFrame + 1) }))} disabled={debugState.currentFrame >= debugState.frames.length - 1}>
              Passo →
            </Button>
            <Button variant="outline" size="sm" onClick={runToEnd} disabled={debugState.frames.length === 0}>
              <SkipForward className="w-4 h-4" /> Final
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700 relative">
            {!isPro && profilerUsageCount >= 1 && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-100 text-sm font-semibold">{t.profilerLocked || "Profiler Locked"}</p>
                  <p className="text-amber-200/70 text-xs mt-1">{profilerUsageCount}/1 {t.freeRunsUsed || "free runs used"}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-200">
                <Clock3 className="w-4 h-4" /> {t.profiler || "Profiler"} (5 {t.executions || "executions"})
                {!isPro && <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-200 text-xs rounded">({1 - profilerUsageCount} {t.freeLeft || "free left"})</span>}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={handleRunProfiler}
                  disabled={!isPro && profilerUsageCount >= 1}
                >
                  {t.runProfiler || "Run Profiler"}
                </Button>
                {profilerRuns.length > 0 && (
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={() => {
                    setProfilerRuns([]);
                    localStorage.removeItem('pro-debugger-profiler');
                  }}>{t.clear || "Clear"}</Button>
                )}
              </div>
            </div>
            {profilerRuns.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-2 h-20 bg-black/30 p-3 rounded-lg">
                  {profilerRuns.map((ms, idx) => {
                    const maxVal = Math.max(...profilerRuns);
                    const height = (ms / maxVal) * 60;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 gap-1">
                        <div className="text-slate-200 text-[10px] font-mono">{ms}ms</div>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t transition-all duration-300" 
                          style={{ height: `${height}px` }} 
                          title={`Execucao ${idx + 1}: ${ms}ms`}
                        />
                        <div className="text-slate-300 text-[10px]">#{idx + 1}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-black/30 p-2 rounded border border-slate-700">
                    <div className="text-slate-300 mb-1">Media</div>
                    <div className="text-slate-200 font-mono font-semibold">
                      {(profilerRuns.reduce((a, b) => a + b, 0) / profilerRuns.length).toFixed(2)} ms
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-slate-700">
                    <div className="text-slate-300 mb-1">Minimo</div>
                    <div className="text-slate-200 font-mono font-semibold">
                      {Math.min(...profilerRuns).toFixed(2)} ms
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-slate-700">
                    <div className="text-slate-300 mb-1">Maximo</div>
                    <div className="text-slate-200 font-mono font-semibold">
                      {Math.max(...profilerRuns).toFixed(2)} ms
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-300 text-sm py-4">
                Execute o profiler para ver estatisticas de performance
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
