import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Brain,
  Workflow,
  Target,
  Trophy,
  BookOpen,
  Code2,
  Flame,
  ClipboardCheck,
  Box,
  ListChecks,
  Hammer,
  Terminal,
  Play,
  Pause,
} from "lucide-react";
import { AlgorithmsRoadmap, FrontendRoadmap, PerformanceRoadmap, DataStructuresRoadmap } from "@/components/guided-path";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { StackFrame, HeapObject } from "@/lib/types";

interface LearningPath {
  id: string;
  title: string;
  progress: number;
  steps: string[];
}

const samplePaths: LearningPath[] = [
  {
    id: "frontend",
    title: "Frontend Track",
    progress: 35,
    steps: ["JS Essentials", "React Basics", "State & Hooks", "Routing", "Testing"],
  },
  {
    id: "backend",
    title: "Backend Track",
    progress: 20,
    steps: ["Node APIs", "Auth & JWT", "Databases", "Caching", "Observability"],
  },
  {
    id: "algorithms",
    title: "Algorithms Track",
    progress: 50,
    steps: ["Complexity", "Arrays", "Trees/Graphs", "DP", "System Design"],
  },
];

const dailyChallenge = {
  title: "Daily Challenge: Two Sum Variations",
  desc: "Resolva em O(n) com hash map e depois tente uma versao com dois ponteiros.",
  difficulty: "Intermediate",
  reward: "+25 XP",
};

const templateSteps: Record<string, string[]> = {
  "Todo App": ["Criar estrutura", "Configurar auth", "Persistir tarefas", "Deploy"],
  "E-commerce": ["Catálogo", "Carrinho", "Checkout", "Pagamentos"],
  "Blog": ["CMS", "SEO", "Comentários", "Deploy"],
};

const templateList = ["Todo App", "E-commerce", "Blog"];

const marketplaceTemplates = [
  { name: "Auth Starter", tag: "Next.js", price: "$0" },
  { name: "Stripe SaaS", tag: "Node", price: "$5" },
  { name: "Landing Pro", tag: "React", price: "$2" },
];

const reviewRules = [
  "Verifique nome de variaveis descritivas",
  "Evite efeitos colaterais invisiveis",
  "Garanta tratamento de erros",
  "Cubra caminhos criticos com testes",
];

const cloneStack = (stack: StackFrame[]) => stack.map((f, idx) => ({
  ...f,
  active: idx === stack.length - 1,
  variables: f.variables.map((v) => ({ ...v })),
}));

const cloneHeap = (heap: HeapObject[]) => heap.map((h) => ({
  ...h,
  properties: h.properties?.map((p) => ({ ...p })) || [],
}));

const createFibFrames = (n: number) => {
  const frames: { stack: StackFrame[]; heap: HeapObject[] }[] = [];
  const callStack: StackFrame[] = [];
  const heap: HeapObject[] = [{ id: "memo", className: "Array", properties: [] }];
  const pushState = () => {
    frames.push({ stack: cloneStack(callStack), heap: cloneHeap(heap) });
  };

  const fib = (value: number, depth: number): number => {
    const frame: StackFrame = {
      id: `${depth}-${callStack.length}-${value}`,
      name: `fib(${value})`,
      active: true,
      variables: [{ name: "n", value, type: "primitive" }],
    };
    callStack.push(frame);
    pushState();

    if (value <= 1) {
      frame.variables.push({ name: "result", value: 1, type: "primitive", changed: true });
      pushState();
      callStack.pop();
      pushState();
      return 1;
    }

    const a: number = fib(value - 1, depth + 1);
    frame.variables.push({ name: "a", value: a, type: "primitive", changed: true });
    pushState();

    const b: number = fib(value - 2, depth + 1);
    frame.variables.push({ name: "b", value: b, type: "primitive", changed: true });
    pushState();

    const result: number = a + b;
    const idx = heap[0].properties?.length || 0;
    heap[0].properties = [...(heap[0].properties || []), { name: String(idx), value: result, type: "primitive", changed: true }];
    frame.variables.push({ name: "result", value: result, type: "primitive", changed: true });
    pushState();
    callStack.pop();
    pushState();
    return result;
  };

  const clamped = Math.min(Math.max(1, n), 7);
  fib(clamped, 0);
  return frames;
};

export function ProAdvancedFeatures() {
  const [mentorInput, setMentorInput] = useState("Explain why my loop is slow");
  const [mentorTips, setMentorTips] = useState<string[]>([]);

  const [builderTemplate, setBuilderTemplate] = useState<string>(templateList[0]);
  const [builderStep, setBuilderStep] = useState<number>(0);

  const [challengeAccepted, setChallengeAccepted] = useState(false);

  const [paths, setPaths] = useState<LearningPath[]>(samplePaths);

  const [genPrompt, setGenPrompt] = useState("Create a debounce function in JavaScript");
  const [genLanguage, setGenLanguage] = useState("JavaScript");
  const [genResult, setGenResult] = useState<string>("");

  const [reviewInput, setReviewInput] = useState("function add(a,b){return a+b}");
  const [reviewFindings, setReviewFindings] = useState<string[]>([]);

  const [liveFrameIdx, setLiveFrameIdx] = useState(0);
  const [livePlaying, setLivePlaying] = useState(true);
  const [liveIntervalMs, setLiveIntervalMs] = useState(1100);
  const [liveInputN, setLiveInputN] = useState(5);
  const [liveFrames, setLiveFrames] = useState<Array<{ stack: StackFrame[]; heap: HeapObject[] }>>(() => createFibFrames(5));
  const liveSampleScript = [
    "function fib(n){",
    "  if(n <= 1) return 1;",
    "  const a = fib(n-1);",
    "  const b = fib(n-2);",
    "  return a + b;",
    "}",
    "fib(5);",
  ].join("\n");

  useEffect(() => {
    if (!livePlaying) return;
    const total = liveFrames.length;
    const interval = Math.max(400, liveIntervalMs);
    const id = setInterval(() => {
      setLiveFrameIdx((prev) => {
        const next = prev + 1;
        if (next >= total) {
          setLivePlaying(false);
          return total - 1;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [livePlaying, liveFrames.length, liveIntervalMs]);

  const regenerateFrames = () => {
    const frames = createFibFrames(liveInputN);
    setLiveFrames(frames);
    setLiveFrameIdx(0);
    setLivePlaying(true);
  };

  const mentorAnalyze = () => {
    const tips: string[] = [];
    if (/loop|for|while/i.test(mentorInput)) tips.push("Use break ou early-return para sair cedo");
    if (/async|await|promise/i.test(mentorInput)) tips.push("Otimize concorrencia com Promise.all e limites de paralelismo");
    if (/db|query|sql/i.test(mentorInput)) tips.push("Adicione indices e use EXPLAIN para medir consultas");
    if (tips.length === 0) tips.push("Divida o problema em partes menores e meça cada etapa");
    setMentorTips(tips);
  };

  const buildNextStep = () => {
    const steps = templateSteps[builderTemplate] || [];
    if (builderStep < steps.length - 1) setBuilderStep((s) => s + 1);
  };

  const incrementPath = (id: string) => {
    setPaths((prev) =>
      prev.map((p) => (p.id === id ? { ...p, progress: Math.min(100, p.progress + 10) } : p))
    );
  };

  const generateCode = () => {
    const lang = genLanguage;
    const base = genPrompt.toLowerCase();
    if (base.includes("debounce")) {
      setGenResult(`// ${lang} debounce\nfunction debounce(fn, wait){\n  let t;\n  return (...args)=>{\n    clearTimeout(t);\n    t=setTimeout(()=>fn(...args), wait);\n  };\n}`);
    } else if (base.includes("api")) {
      setGenResult(`// ${lang} simple fetch\nasync function getData(url){\n  const res = await fetch(url);\n  if(!res.ok) throw new Error('fail');\n  return res.json();\n}`);
    } else {
      setGenResult(`// ${lang} stub\nfunction solution(){\n  // TODO: implement\n}`);
    }
  };

  const reviewCode = () => {
    const findings: string[] = [];
    if (!/test|assert/i.test(reviewInput)) findings.push("Adicione testes para cobrir casos base e bordas");
    if (/var\s+/.test(reviewInput)) findings.push("Prefira const/let no lugar de var");
    if (/console\.log/.test(reviewInput)) findings.push("Remova logs em producao");
    if (findings.length === 0) findings.push("Nenhum problema critico encontrado");
    setReviewFindings(findings);
  };

  const renderPath = (p: LearningPath) => (
    <Card key={p.id} className="p-4 bg-slate-900/60 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <BookOpen className="w-4 h-4 text-amber-300" />
          {p.title}
        </div>
        <span className="text-xs text-amber-200">{p.progress}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded">
        <div
          className="h-2 bg-amber-400 rounded"
          style={{ width: `${p.progress}%` }}
        />
      </div>
      <ul className="mt-3 text-xs text-gray-300 space-y-1">
        {p.steps.map((s, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <ListChecks className="w-3 h-3 text-amber-200" />
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" className="border-amber-300/40" onClick={() => incrementPath(p.id)}>
          Marcar progresso +10%
        </Button>
      </div>
    </Card>
  );

  const flameData = useMemo(
    () => [
      { name: "main", pct: 40 },
      { name: "parseInput", pct: 25 },
      { name: "compute", pct: 20 },
      { name: "format", pct: 15 },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Code Mentor */}
        <Card className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <h3 className="text-lg font-semibold text-white">AI Code Mentor</h3>
          </div>
          <textarea
            value={mentorInput}
            onChange={(e) => setMentorInput(e.target.value)}
            className="w-full h-28 bg-black/50 border border-indigo-400/20 rounded p-3 text-sm text-white"
            placeholder="Pergunte algo sobre seu codigo..."
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={mentorAnalyze}>
              Gerar dicas
            </Button>
          </div>
          <ul className="mt-3 text-sm text-indigo-100 space-y-2">
            {mentorTips.map((tip, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-300" />
                {tip}
              </li>
            ))}
            {mentorTips.length === 0 && <li className="text-gray-400 text-sm">Nenhuma dica gerada ainda.</li>}
          </ul>
        </Card>

        {/* Project Builder */}
        <Card className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Hammer className="w-4 h-4 text-emerald-300" />
            <h3 className="text-lg font-semibold text-white">Project Builder</h3>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {templateList.map((tpl) => (
              <Button
                key={tpl}
                size="sm"
                variant={tpl === builderTemplate ? "default" : "outline"}
                className={tpl === builderTemplate ? "bg-emerald-500 text-black" : "border-emerald-300/40 text-emerald-100"}
                onClick={() => {
                  setBuilderTemplate(tpl);
                  setBuilderStep(0);
                }}
              >
                {tpl}
              </Button>
            ))}
          </div>
          <div className="text-sm text-emerald-50 mb-2">Passo {builderStep + 1} de {(templateSteps[builderTemplate] || []).length}</div>
          <Card className="p-3 bg-black/40 border border-emerald-400/20 text-sm text-emerald-50">
            {(templateSteps[builderTemplate] || [])[builderStep] || "Selecione um template"}
          </Card>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={buildNextStep} disabled={(templateSteps[builderTemplate] || []).length === 0}>
              Proximo passo
            </Button>
            <Button size="sm" variant="outline" className="border-emerald-300/40 text-emerald-100">
              Gerar estrutura
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Challenges Arena */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-300" />
            <h3 className="text-lg font-semibold text-white">Challenges Arena</h3>
          </div>
          <p className="text-sm text-gray-200">{dailyChallenge.title}</p>
          <p className="text-xs text-gray-400 mt-1">{dailyChallenge.desc}</p>
          <div className="text-xs text-gray-300 mt-2">{dailyChallenge.difficulty} • {dailyChallenge.reward}</div>
          <Button className="mt-3" size="sm" onClick={() => setChallengeAccepted(true)}>
            {challengeAccepted ? "Em andamento" : "Aceitar desafio"}
          </Button>
        </Card>

        {/* Learning Paths */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-amber-300" />
            <h3 className="text-lg font-semibold text-white">Learning Paths</h3>
          </div>
          <div className="space-y-3">
            {paths.map((p) => renderPath(p))}
          </div>
        </Card>

        {/* AI Code Generator */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">AI Code Generator</h3>
          </div>
          <input
            className="w-full text-sm bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-white"
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
          />
          <div className="flex gap-2 mt-2 text-sm text-white">
            <select
              value={genLanguage}
              onChange={(e) => setGenLanguage(e.target.value)}
              className="bg-black/50 border border-cyan-400/30 rounded px-2 py-1"
            >
              <option>JavaScript</option>
              <option>TypeScript</option>
              <option>Python</option>
            </select>
            <Button size="sm" onClick={generateCode}>Gerar</Button>
          </div>
          <pre className="mt-3 bg-black/60 text-xs text-cyan-100 rounded p-3 h-32 overflow-auto">{genResult}</pre>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Profiler Pro */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-300" />
            <h3 className="text-lg font-semibold text-white">Performance Profiler Pro</h3>
          </div>
          <p className="text-sm text-gray-200">Flamegraph simplificado (mock).</p>
          <div className="space-y-2 mt-3">
            {flameData.map((f) => (
              <div key={f.name} className="text-xs text-gray-200">
                <span className="text-amber-300 font-semibold">{f.name}</span> — {f.pct}%
                <div className="h-2 bg-black/40 rounded mt-1">
                  <div className="h-2 bg-amber-400 rounded" style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Realtime Code Visualizer */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">Realtime Code Visualizer</h3>
          </div>
          <p className="text-sm text-gray-200 mb-3">Veja call stack e heap se atualizando em tempo real durante a recursao (fibonacci).</p>
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-cyan-50">
            <span className={`px-2 py-1 rounded-full border shadow-[0_0_0_1px_rgba(34,211,238,0.25)] ${livePlaying ? "border-emerald-300/60 bg-emerald-700/40 text-emerald-50" : "border-cyan-300/60 bg-cyan-800/40 text-cyan-50"}`}>
              {livePlaying ? "reproduzindo" : "pausado"}
            </span>
            <Button size="sm" variant="outline" className="border-cyan-300/70 text-cyan-50 hover:bg-cyan-500/15" onClick={() => setLivePlaying((p) => !p)}>
              {livePlaying ? <><Pause className="w-3 h-3 mr-1" /> Pausar</> : <><Play className="w-3 h-3 mr-1" /> Retomar</>}
            </Button>
            <Button size="sm" variant="ghost" className="text-cyan-100 hover:bg-cyan-500/10" onClick={() => { setLiveFrameIdx(0); setLivePlaying(true); }}>
              Reiniciar
            </Button>
            <div className="flex items-center gap-1 ml-auto">
              {[800, 1100, 1500].map((ms) => (
                <button
                  key={ms}
                  onClick={() => setLiveIntervalMs(ms)}
                  className={`px-2 py-1 rounded border text-[11px] ${liveIntervalMs === ms ? "bg-cyan-500/20 border-cyan-300/60 text-cyan-50" : "bg-slate-900/60 border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"}`}
                >
                  {ms}ms
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <input
                type="number"
                min={1}
                max={7}
                value={liveInputN}
                onChange={(e) => setLiveInputN(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
                className="w-16 rounded border border-cyan-400/40 bg-slate-950/70 text-cyan-50 text-xs px-2 py-1"
                aria-label="Entrada fib"
              />
              <Button size="sm" variant="outline" className="border-emerald-300/60 text-emerald-50 hover:bg-emerald-500/15" onClick={regenerateFrames}>
                Gerar frames
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-cyan-950/40 rounded-lg border border-cyan-300/35 shadow-[0_0_0_1px_rgba(34,211,238,0.15)] p-3 max-h-72 overflow-auto">
              <CallStack stack={liveFrames[liveFrameIdx].stack} />
            </div>
            <div className="bg-emerald-950/40 rounded-lg border border-emerald-300/35 shadow-[0_0_0_1px_rgba(16,185,129,0.18)] p-3 max-h-72 overflow-auto">
              <HeapMemory heap={liveFrames[liveFrameIdx].heap} />
            </div>
          </div>
          <div className="mt-3 bg-slate-950/70 border border-cyan-400/25 rounded-lg p-3">
            <div className="text-xs text-cyan-100 mb-2">Script que gera os frames (execucao local simulada)</div>
            <pre className="text-[11px] leading-relaxed text-cyan-50 font-mono overflow-auto bg-black/40 border border-cyan-400/20 rounded p-3 max-h-40">
{liveSampleScript}
            </pre>
          </div>
        </Card>

        {/* Code Review Bot */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-green-300" />
            <h3 className="text-lg font-semibold text-white">Code Review Bot</h3>
          </div>
          <textarea
            value={reviewInput}
            onChange={(e) => setReviewInput(e.target.value)}
            className="w-full h-24 bg-black/50 border border-green-400/30 rounded p-2 text-sm text-white"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={reviewCode}>Analisar</Button>
          </div>
          <ul className="mt-3 text-sm text-green-100 space-y-1">
            {reviewFindings.map((f, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <ListChecks className="w-3 h-3 text-green-300" />
                {f}
              </li>
            ))}
            {reviewFindings.length === 0 && <li className="text-gray-400 text-sm">Nenhum achado ainda.</li>}
          </ul>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Debug 3D Visualization */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-300" />
            <h3 className="text-lg font-semibold text-white">Debug 3D Visualization</h3>
          </div>
          <p className="text-sm text-gray-200">Visualizacao 3D (mock): arvores, grafos e listas.</p>
          <div className="mt-3 h-32 bg-black/40 rounded flex items-center justify-center text-xs text-gray-400">
            Canvas 3D placeholder
          </div>
        </Card>

        {/* Templates Marketplace */}
        <Card className="p-4 bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-4 h-4 text-blue-300" />
            <h3 className="text-lg font-semibold text-white">Templates Marketplace</h3>
          </div>
          <div className="space-y-2">
            {marketplaceTemplates.map((tpl) => (
              <Card key={tpl.name} className="p-3 bg-black/40 border border-blue-400/20">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white">
                    <span className="font-semibold">{tpl.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{tpl.tag}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-blue-200">{tpl.price}</span>
                    <Button size="sm" variant="outline" className="border-blue-300/40 text-blue-100">
                      <Terminal className="w-3 h-3 mr-1" /> Usar Template
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      {/* Guided Roadmaps */}
      <div className="grid md:grid-cols-2 gap-6">
        <AlgorithmsRoadmap />
        <FrontendRoadmap />
        <PerformanceRoadmap />
        <DataStructuresRoadmap />
      </div>
    </div>
  );
}
