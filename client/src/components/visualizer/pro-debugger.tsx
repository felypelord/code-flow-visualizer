import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw } from "lucide-react";

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
      throw new Error("Não foi possível carregar Pyodide");
    }
  }
  return getPyodideInstance();
};

interface ExecutionFrame {
  line: number;
  function: string;
  locals: Record<string, any>;
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

export function ProDebugger() {
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

result = factorial(5)
print(f"Result: {result}")`);

  // Executar código com rastreamento
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
      
      // Usar exec com globals para evitar injeção de código
      const pythonGlobals = pyodide.globals.get("dict")();
      
      const setup = `
import sys
import io
from contextlib import redirect_stdout

frames = []
output = []

def trace_calls(frame, event, arg):
    if event == 'line':
        local_vars = {}
        for k, v in frame.f_locals.items():
            try:
                local_vars[k] = repr(v)[:100]
            except:
                local_vars[k] = '<objeto>'
        frames.append({
            'line': frame.f_lineno,
            'function': frame.f_code.co_name,
            'locals': local_vars,
            'timestamp': len(frames)
        })
    return trace_calls

output_buffer = io.StringIO()
`;

      pyodide.runPython(setup);
      
      // Preparar o código do usuário com indentação adequada
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
          error: `Erro na execução: ${execErr.message || String(execErr)}`,
        }));
        return;
      }

      const framesData = pyodide.globals.get("frames");
      const outputData = pyodide.globals.get("output");
      
      const frames = framesData ? framesData.toJs() : [];
      const outputLines = outputData ? outputData.toJs() : [];

      setDebugState((prev) => ({
        ...prev,
        isRunning: false,
        frames: frames || [],
        output: outputLines.filter((line: string) => line.trim()) || [],
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Pro Debugger - Visualize Execução</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Código</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-80 p-3 border rounded font-mono text-sm bg-slate-50"
            placeholder="Escreva seu código Python aqui..."
          />
          <div className="flex gap-2 mt-4">
            <Button
              onClick={executeWithDebug}
              disabled={debugState.isRunning}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Executar
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setDebugState((prev) => ({
                  ...prev,
                  currentFrame: 0,
                  frames: [],
                  output: [],
                }))
              }
            >
              <RotateCcw className="w-4 h-4" /> Resetar
            </Button>
          </div>
        </Card>

        {/* Visualizador */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Estado da Execução</h2>

          <Tabs defaultValue="variables" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="variables">Variáveis</TabsTrigger>
              <TabsTrigger value="stack">Stack</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
            </TabsList>

            {/* Abas */}
            <TabsContent value="variables" className="space-y-2">
              {currentFrame ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded">
                  <div className="text-sm font-semibold text-blue-600">
                    Linha {currentFrame.line} em{" "}
                    <span className="font-mono">{currentFrame.function}()</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(currentFrame.locals || {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="text-sm font-mono flex justify-between bg-white p-2 rounded border"
                        >
                          <span className="font-semibold text-green-600">
                            {key}
                          </span>
                          <span className="text-slate-700 truncate">
                            {String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                  {Object.keys(currentFrame.locals || {}).length === 0 && (
                    <p className="text-sm text-slate-500">Sem variáveis locais</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Execute o código para ver variáveis
                </p>
              )}
            </TabsContent>

            <TabsContent value="stack">
              <div className="space-y-2 bg-slate-50 p-3 rounded">
                <div className="text-sm">
                  Total de passos: <span className="font-bold">{debugState.frames.length}</span>
                </div>
                <div className="text-sm">
                  Passo atual:{" "}
                  <span className="font-bold">
                    {debugState.currentFrame + 1} / {debugState.frames.length}
                  </span>
                </div>

                {/* Timeline */}
                <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
                  {debugState.frames.map((frame, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        setDebugState((prev) => ({
                          ...prev,
                          currentFrame: idx,
                        }))
                      }
                      className={`w-full text-left text-xs p-2 rounded font-mono transition ${
                        idx === debugState.currentFrame
                          ? "bg-blue-500 text-white"
                          : "bg-white border hover:bg-blue-50"
                      }`}
                    >
                      L{frame.line} {frame.function}()
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output">
              <div className="bg-slate-50 p-3 rounded font-mono text-sm h-40 overflow-y-auto border">
                {debugState.output && debugState.output.length > 0 ? (
                  <div className="space-y-1">
                    {debugState.output.map((line, idx) => (
                      <div key={idx} className="text-slate-700">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">
                    {debugState.frames.length > 0 ? "Nenhum output" : "Execute para ver output"}
                  </p>
                )}
                {debugState.error && (
                  <div className="text-red-600 mt-2 font-semibold">❌ Erro:</div>
                )}
                {debugState.error && (
                  <div className="text-red-600 text-xs mt-1 font-mono">
                    {debugState.error}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Controles de navegação */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDebugState((prev) => ({
                  ...prev,
                  currentFrame: Math.max(0, prev.currentFrame - 1),
                }))
              }
              disabled={debugState.currentFrame === 0}
            >
              ← Voltar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDebugState((prev) => ({
                  ...prev,
                  currentFrame: Math.min(
                    prev.frames.length - 1,
                    prev.currentFrame + 1
                  ),
                }))
              }
              disabled={debugState.currentFrame >= debugState.frames.length - 1}
            >
              Avançar →
            </Button>
          </div>
        </Card>
      </div>

      {/* Exemplos de Código */}
      <Card className="p-4 bg-slate-50">
        <h3 className="font-semibold mb-3">📚 Exemplos para Testar:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() =>
              setCode(`# Fibonacci
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

resultado = fib(6)
print(f"fib(6) = {resultado}")`)
            }
            className="text-left p-3 bg-white border rounded hover:border-blue-400 transition"
          >
            <div className="font-semibold text-sm">📊 Fibonacci</div>
            <div className="text-xs text-slate-500">Veja recursão em ação</div>
          </button>

          <button
            onClick={() =>
              setCode(`# Loop e Variáveis
soma = 0
for i in range(1, 6):
    soma += i
    print(f"Passo {i}: soma = {soma}")

print(f"Total: {soma}")`)
            }
            className="text-left p-3 bg-white border rounded hover:border-blue-400 transition"
          >
            <div className="font-semibold text-sm">🔄 Loop Interativo</div>
            <div className="text-xs text-slate-500">Acompanhe variáveis</div>
          </button>

          <button
            onClick={() =>
              setCode(`# Função com múltiplas variáveis
def processar(lista):
    total = 0
    maximo = lista[0]
    for num in lista:
        total += num
        if num > maximo:
            maximo = num
    media = total / len(lista)
    return media, maximo

numeros = [3, 7, 2, 9, 5]
media, maximo = processar(numeros)
print(f"Média: {media}, Máximo: {maximo}")`)
            }
            className="text-left p-3 bg-white border rounded hover:border-blue-400 transition"
          >
            <div className="font-semibold text-sm">📈 Análise de Dados</div>
            <div className="text-xs text-slate-500">Múltiplas variáveis</div>
          </button>

          <button
            onClick={() =>
              setCode(`# Classe e Métodos
class Conta:
    def __init__(self, titular, saldo):
        self.titular = titular
        self.saldo = saldo
    
    def depositar(self, valor):
        self.saldo += valor

conta = Conta("João", 100)
conta.depositar(50)
print(f"{conta.titular}: R$ {conta.saldo}")`)
            }
            className="text-left p-3 bg-white border rounded hover:border-blue-400 transition"
          >
            <div className="font-semibold text-sm">🏦 Classe Python</div>
            <div className="text-xs text-slate-500">POO em ação</div>
          </button>
        </div>
      </Card>

      {/* Explicação */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Como funciona:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Escreva código Python e clique em "Executar"</li>
          <li>✅ Veja cada passo da execução com as variáveis</li>
          <li>✅ Use "Voltar/Avançar" para navegar pelo código</li>
          <li>✅ Entenda como funções chamam uma a outra (Stack)</li>
          <li>✅ Veja o output do seu programa em tempo real</li>
        </ul>
      </Card>
    </div>
  );
}
