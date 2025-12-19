import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, HelpCircle, Lock, Unlock, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface GuidedStep {
  id: string;
  title: string;
  lesson: string | string[];
  taskPrompt: string;
  check: (codeOrAnswer: string) => { ok: boolean; messages?: string[] };
}

export interface GuidedPathProps {
  id: string;
  title: string;
  steps: GuidedStep[];
  onComplete?: () => void;
}

function usePersistedProgress(key: string, maxSteps: number) {
  const [progress, setProgress] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(key);
      const v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : Math.min(v, maxSteps);
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, String(progress)); } catch {}
  }, [key, progress]);
  return [progress, setProgress] as const;
}

export function GuidedPath({ id, title, steps, onComplete }: GuidedPathProps) {
  const storageKey = `guided:${id}:progress`;
  const [progress, setProgress] = usePersistedProgress(storageKey, steps.length);
  const [open, setOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number>(progress);
  const currentStep = steps[currentIdx];
  const [answer, setAnswer] = useState<string>("");
  const [result, setResult] = useState<{ ok: boolean; messages?: string[] } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentIdx(progress);
  }, [progress]);

  const pct = useMemo(() => Math.round((progress / steps.length) * 100), [progress, steps.length]);

  const startLesson = () => { setOpen(true); setResult(null); };
  const closeLesson = () => setOpen(false);
  const resetProgress = () => { setProgress(0); setCurrentIdx(0); setAnswer(""); setResult(null); };

  const verify = () => {
    if (!currentStep) return;
    const r = currentStep.check(answer);
    setResult(r);
    if (r.ok) {
      const next = Math.min(steps.length, progress + 1);
      setProgress(next);
      setAnswer("");
      setOpen(false);
      if (next >= steps.length) onComplete?.();
    }
  };

  return (
    <Card className="p-4 bg-slate-900/70 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300" />
          {title}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-200">{pct}%</span>
          <Button size="sm" variant="outline" className="border-amber-300/40 text-amber-100" onClick={resetProgress}>{t.reset || "Resetar"}</Button>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded">
        <div className="h-2 bg-amber-400 rounded" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-2">
        {steps.map((s, idx) => {
          const locked = idx > progress;
          const done = idx < progress;
          const isCurrent = idx === progress;
          return (
            <div key={s.id} className="flex items-center gap-3 bg-black/30 border border-white/10 rounded px-3 py-2">
              <div className="w-5">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : locked ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{idx + 1}. {s.title}</div>
                <div className="text-xs text-gray-400">{typeof s.lesson === "string" ? s.lesson : s.lesson[0]}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="border-amber-300/40 text-amber-100" onClick={() => { setCurrentIdx(idx); startLesson(); }} disabled={locked}>
                  <HelpCircle className="w-3 h-3" /> {t.lesson || "Aula"}
                </Button>
                <Button size="sm" onClick={() => { setCurrentIdx(idx); setOpen(true); }} disabled={locked}>
                  {t.practice || "Praticar"} <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border border-amber-400/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{currentStep?.title}</DialogTitle>
            <DialogDescription className="text-amber-100/80">
              {Array.isArray(currentStep?.lesson) ? (
                <ul className="list-disc ml-4 space-y-1">
                  {currentStep!.lesson.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              ) : (
                <span>{currentStep?.lesson}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="text-sm text-gray-200 mb-2">{(t.taskLabel || "Tarefa") + ": "}{currentStep?.taskPrompt}</div>
            <textarea
              className="w-full h-32 rounded-lg bg-black/40 border border-amber-400/20 text-sm text-white p-3 font-mono"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t.typeYourSolution || "Digite sua solução aqui"}
            />
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={verify} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">{t.verify || "Verificar"}</Button>
              <Button variant="outline" className="border-amber-400/40 text-amber-200" onClick={closeLesson}>{t.close || "Fechar"}</Button>
              {result && (
                <span className={"text-sm " + (result.ok ? "text-emerald-300" : "text-red-300")}>{result.ok ? (t.correct || "Correto!") : (t.tryAgain || "Tente novamente")}</span>
              )}
            </div>
            {result?.messages && result.messages.length > 0 && (
              <ul className="mt-2 text-xs text-gray-300 space-y-1">
                {result.messages.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// A ready-to-use sample path for Pro users.
export function SampleGuidedRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "two-sum",
      title: "Algoritmos: Two Sum",
      lesson: [
        "Use um mapa para registrar indices por valor.",
        "Itere uma vez, verifique se (target - atual) ja existe.",
        "Complexidade O(n); evite O(n^2).",
      ],
      taskPrompt: "Implemente a funcao twoSum(nums, target) que retorna os indices corretos.",
      check: (code) => {
        const messages: string[] = [];
        try {
          const fn = new Function(`${code}; return typeof twoSum === 'function' ? twoSum : null;`);
          const twoSum = fn();
          if (!twoSum) return { ok: false, messages: ["Defina a funcao twoSum"] };
          const tests = [
            { nums: [2,7,11,15], target: 9, out: [0,1] },
            { nums: [3,2,4], target: 6, out: [1,2] },
            { nums: [3,3], target: 6, out: [0,1] },
          ];
          for (const t of tests) {
            const res = twoSum([...t.nums], t.target);
            if (!res || res.length !== 2 || (res[0] !== t.out[0] || res[1] !== t.out[1])) {
              messages.push(`Falhou para ${JSON.stringify(t.nums)} => ${JSON.stringify(res)}`);
              return { ok: false, messages };
            }
          }
          return { ok: true };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "binary-search",
      title: "Algoritmos: Binary Search",
      lesson: [
        "Binary Search divide o array ao meio repetidamente.",
        "Mantenha ponteiros low/high e calcule mid.",
        "Retorne indice se encontrado ou -1 se ausente.",
      ],
      taskPrompt: "Implemente binarySearch(arr, target) em array ordenado.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof binarySearch === 'function' ? binarySearch : null;`);
          const bs = fn();
          if (!bs) return { ok: false, messages: ["Defina a funcao binarySearch"] };
          const ok = bs([1,3,5,7,9], 7) === 3 && bs([1,3,5,7,9], 2) === -1;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "palindrome",
      title: "Strings: Palindrome",
      lesson: [
        "Normalizar string (minusculas, remover nao alfanumericos).",
        "Compare com a reversa.",
      ],
      taskPrompt: "Implemente isPalindrome(s) retornando boolean.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof isPalindrome === 'function' ? isPalindrome : null;`);
          const isP = fn();
          if (!isP) return { ok: false, messages: ["Defina a funcao isPalindrome"] };
          const ok = isP("A man, a plan, a canal: Panama") === true && isP("race a car") === false;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "debounce",
      title: "Frontend: Debounce",
      lesson: [
        "Debounce adia execucao ate apos um periodo de inatividade.",
        "Use um timer persistente dentro do closure.",
        "Limpe o timer a cada chamada antes de agendar a proxima.",
      ],
      taskPrompt: "Implemente debounce(fn, wait) que retorna uma funcao que agrupa chamadas.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof debounce === 'function' ? debounce : null;`);
          const debounce = fn();
          if (!debounce) return { ok: false, messages: ["Defina a funcao debounce"] };
          let calls = 0;
          const wrapped = debounce(() => { calls++; }, 10);
          wrapped(); wrapped(); wrapped();
          return { ok: calls === 0 };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "react-state",
      title: "React: Estado",
      lesson: "Explique como usar useState para gerenciar estado local em componentes.",
      taskPrompt: "Escreva um snippet com 'useState' e atualizacao de estado.",
      check: (code) => {
        if (/useState/.test(code) && /=\s*set[A-Z]/.test(code)) {
          return { ok: true };
        }
        return { ok: false, messages: ["Inclua 'useState' e uma atualizacao de estado (setXYZ)"] };
      },
    },
    {
      id: "memoize",
      title: "Performance: Memoization",
      lesson: [
        "Memoize armazena resultados de funcoes puras.",
        "Use mapa de cache por chave de argumentos.",
      ],
      taskPrompt: "Implemente memoize(fn) que retorna funcao com cache.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof memoize === 'function' ? memoize : null;`);
          const memoize = fn();
          if (!memoize) return { ok: false, messages: ["Defina a funcao memoize"] };
          let hits = 0;
          const slow = (n: number) => { hits++; return n * n; };
          const mslow = memoize(slow as any);
          const a = mslow(4);
          const b = mslow(4);
          const c = mslow(5);
          const ok = a === 16 && b === 16 && c === 25 && hits === 2;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
    {
      id: "binary-tree-depth",
      title: "Estruturas: Profundidade de Arvore",
      lesson: [
        "Defina Node com left/right e calcule maxDepth.",
        "Use recursao: 1 + max(depth(left), depth(right)).",
      ],
      taskPrompt: "Implemente maxDepth(root) retornando a maior profundidade.",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof maxDepth === 'function' ? maxDepth : null;`);
          const maxDepth = fn();
          if (!maxDepth) return { ok: false, messages: ["Defina a funcao maxDepth"] };
          const tree = { val: 1, left: { val: 2, left: { val: 3 } }, right: { val: 4 } } as any;
          const ok = maxDepth(tree) === 3;
          return { ok };
        } catch (e: any) {
          return { ok: false, messages: [e?.message || String(e)] };
        }
      },
    },
  ];
  return <GuidedPath id="pro-roadmap" title="Pro Guided Roadmap" steps={steps} />;
}

export function AlgorithmsRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "two-sum",
      title: "Algoritmos: Two Sum",
      lesson: ["Mapa de indices", "Iteracao unica", "Complexidade O(n)"],
      taskPrompt: "twoSum(nums, target)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof twoSum === 'function' ? twoSum : null;`);
          const twoSum = fn();
          if (!twoSum) return { ok: false, messages: ["Defina twoSum"] };
          const tests = [
            { input: [2,7,11,15], target: 9, expected: [0,1] },
            { input: [3,2,4], target: 6, expected: [1,2] },
          ];
          for (const t of tests) {
            const res = twoSum(t.input, t.target);
            if (!res || JSON.stringify(res) !== JSON.stringify(t.expected)) {
              return { ok: false, messages: [`Falhou: ${JSON.stringify(t.input)}, ${t.target} => ${JSON.stringify(res)}`] };
            }
          }
          return { ok: true, messages: ["Excelente! Sua solução O(n) está perfeita."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "binary-search",
      title: "Algoritmos: Binary Search",
      lesson: ["low/high/mid", "Dividir e conquistar", "Array deve estar ordenado"],
      taskPrompt: "binarySearch(arr, target)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof binarySearch === 'function' ? binarySearch : null;`);
          const bs = fn();
          if (!bs) return { ok: false, messages: ["Defina binarySearch"] };
          const tests = [
            { arr: [1,3,5,7,9], target: 7, expected: 3 },
            { arr: [1,3,5,7,9], target: 2, expected: -1 },
            { arr: [1,2,3,4,5], target: 1, expected: 0 },
          ];
          for (const t of tests) {
            const res = bs(t.arr, t.target);
            if (res !== t.expected) {
              return { ok: false, messages: [`Falhou para ${t.target} em ${JSON.stringify(t.arr)}: esperado ${t.expected}, obteve ${res}`] };
            }
          }
          return { ok: true, messages: ["Perfeito! Implementação O(log n)."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "palindrome",
      title: "Strings: Palíndromo",
      lesson: ["Normalizar string", "Comparar com reverso", "Ignorar espaços/pontuação"],
      taskPrompt: "isPalindrome(s)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof isPalindrome === 'function' ? isPalindrome : null;`);
          const isP = fn();
          if (!isP) return { ok: false, messages: ["Defina isPalindrome"] };
          const tests = [
            { input: "A man, a plan, a canal: Panama", expected: true },
            { input: "race a car", expected: false },
            { input: "0P", expected: false },
          ];
          for (const t of tests) {
            const res = isP(t.input);
            if (res !== t.expected) {
              return { ok: false, messages: [`Falhou para "${t.input}": esperado ${t.expected}, obteve ${res}`] };
            }
          }
          return { ok: true, messages: ["Excelente! Validação de palíndromo completa."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "merge-sorted",
      title: "Algoritmos: Merge Sorted Arrays",
      lesson: ["Dois ponteiros", "Comparar elementos", "Array resultado ordenado"],
      taskPrompt: "mergeSorted(arr1, arr2)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof mergeSorted === 'function' ? mergeSorted : null;`);
          const merge = fn();
          if (!merge) return { ok: false, messages: ["Defina mergeSorted"] };
          const res = merge([1,3,5], [2,4,6]);
          const ok = JSON.stringify(res) === JSON.stringify([1,2,3,4,5,6]);
          if (!ok) return { ok: false, messages: [`Resultado: ${JSON.stringify(res)}, esperado [1,2,3,4,5,6]`] };
          return { ok: true, messages: ["Ótimo! Arrays mesclados corretamente."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "longest-substring",
      title: "Strings: Longest Substring sem Repetição",
      lesson: ["Janela deslizante", "Hash set para rastrear chars", "Melhor complexidade"],
      taskPrompt: "lengthOfLongestSubstring(s)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof lengthOfLongestSubstring === 'function' ? lengthOfLongestSubstring : null;`);
          const fn2 = fn();
          if (!fn2) return { ok: false, messages: ["Defina lengthOfLongestSubstring"] };
          const tests = [
            { input: "abcabcbb", expected: 3 },
            { input: "bbbbb", expected: 1 },
            { input: "pwwkew", expected: 3 },
          ];
          for (const t of tests) {
            const res = fn2(t.input);
            if (res !== t.expected) {
              return { ok: false, messages: [`Para "${t.input}": esperado ${t.expected}, obteve ${res}`] };
            }
          }
          return { ok: true, messages: ["Perfeito! Solução otimizada com janela deslizante."] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
  ];
  return <GuidedPath id="algorithms-roadmap" title="Pro Roadmap: Algoritmos" steps={steps} />;
}

export function FrontendRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "debounce",
      title: "Frontend: Debounce",
      lesson: ["Timer persistente", "Limpar antes de agendar", "Closure para manter estado"],
      taskPrompt: "debounce(fn, wait)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof debounce === 'function' ? debounce : null;`);
          const debounce = fn();
          if (!debounce) return { ok: false, messages: ["Defina debounce"] };
          let calls = 0;
          const wrapped = debounce(() => { calls++; }, 50);
          wrapped(); wrapped(); wrapped();
          setTimeout(() => {
            if (calls === 1) return { ok: true, messages: ["Excelente! Debounce funcionando."] };
          }, 100);
          return { ok: true };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "event-delegation",
      title: "Frontend: Event Delegation",
      lesson: ["Ouvir no container", "event.target para identificar", "Evitar múltiplos listeners"],
      taskPrompt: "Implemente event delegation com addEventListener",
      check: (code) => {
        const ok = /addEventListener/.test(code) && /event\.target/.test(code);
        const msgs = ok ? ["Perfeito! Event delegation implementado."] : ["Inclua addEventListener e event.target"];
        return { ok, messages: msgs };
      },
    },
    {
      id: "throttle",
      title: "Frontend: Throttle",
      lesson: ["Limitar frequência de chamadas", "Timer de última execução", "Sempre executar na primeira"],
      taskPrompt: "throttle(fn, delay)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof throttle === 'function' ? throttle : null;`);
          const throttle = fn();
          if (!throttle) return { ok: false, messages: ["Defina throttle"] };
          let calls = 0;
          const wrapped = throttle(() => { calls++; }, 100);
          wrapped(); wrapped(); wrapped();
          if (calls >= 1) return { ok: true, messages: ["Bom! Throttle reduzindo chamadas."] };
          return { ok: false, messages: ["Throttle não funcionou como esperado"] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "react-effect-cleanup",
      title: "React: useEffect Cleanup",
      lesson: ["Retornar função de cleanup", "Evitar memory leaks", "Cleanup roda antes do unmount"],
      taskPrompt: "useEffect(() => { ...; return () => {...} }, [])",
      check: (code) => {
        const hasEffect = /useEffect\s*\(/.test(code);
        const hasCleanup = /return\s*\(\s*\)\s*=>|return\s*function/.test(code);
        if (hasEffect && hasCleanup) {
          return { ok: true, messages: ["Ótimo! Cleanup function implementado corretamente."] };
        }
        return { ok: false, messages: ["Inclua useEffect com função de cleanup"] };
      },
    },
    {
      id: "dom-manipulation",
      title: "DOM: Manipulação Eficiente",
      lesson: ["Usar innerHTML com cuidado", "DocumentFragment para batch", "Evitar reflows desnecessários"],
      taskPrompt: "Crie elementos e insira-os uma única vez no DOM",
      check: (code) => {
        const hasFragment = /DocumentFragment|createDocumentFragment/.test(code);
        const msgs = hasFragment ? ["Excelente! Usando DocumentFragment para eficiência."] : ["Considere usar DocumentFragment para múltiplas inserções"];
        return { ok: hasFragment, messages: msgs };
      },
    },
  ];
  return <GuidedPath id="frontend-roadmap" title="Pro Roadmap: Frontend" steps={steps} />;
}

export function PerformanceRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "memoize",
      title: "Performance: Memoization",
      lesson: ["Cache por argumentos", "Funções puras", "Chave de cache eficiente"],
      taskPrompt: "memoize(fn)",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof memoize === 'function' ? memoize : null;`);
          const memoize = fn();
          if (!memoize) return { ok: false, messages: ["Defina memoize"] };
          let hits = 0;
          const slow = (n: number) => { hits++; return n * n; };
          const mslow = memoize(slow as any);
          mslow(4); mslow(4); mslow(5);
          if (hits === 2) return { ok: true, messages: ["Perfeito! Cache funcionando, apenas 2 execuções."] };
          return { ok: false, messages: [`Cache falhou: ${hits} execuções (esperado 2)`] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "lazy-load",
      title: "Performance: Lazy Loading",
      lesson: ["Adiar carregamento", "IntersectionObserver API", "Economizar banda inicial"],
      taskPrompt: "Crie um observador para lazy loading de imagens",
      check: (code) => {
        const hasObserver = /IntersectionObserver|Intersection/.test(code);
        const msgs = hasObserver ? ["Excelente! IntersectionObserver para lazy load."] : ["Considere usar IntersectionObserver"];
        return { ok: hasObserver, messages: msgs };
      },
    },
    {
      id: "code-splitting",
      title: "Performance: Code Splitting",
      lesson: ["Importar dinamicamente", "Reduzir bundle inicial", "React.lazy em rotas"],
      taskPrompt: "Implemente dynamic import ou React.lazy",
      check: (code) => {
        const hasDynamic = /import\(|React\.lazy/.test(code);
        if (hasDynamic) {
          return { ok: true, messages: ["Ótimo! Code splitting configurado."] };
        }
        return { ok: false, messages: ["Use import() ou React.lazy para code splitting"] };
      },
    },
    {
      id: "virtual-scroll",
      title: "Performance: Virtual Scrolling",
      lesson: ["Renderizar apenas itens visíveis", "Índice start/end", "Melhor para grandes listas"],
      taskPrompt: "Renderizar lista com 10k+ itens eficientemente",
      check: (code) => {
        const hasIndexing = /start|end|offset|visible/.test(code) && /slice|map/.test(code);
        if (hasIndexing) {
          return { ok: true, messages: ["Bom! Você está renderizando seletivamente."] };
        }
        return { ok: false, messages: ["Use índices start/end para renderizar apenas itens visíveis"] };
      },
    },
  ];
  return <GuidedPath id="performance-roadmap" title="Pro Roadmap: Performance" steps={steps} />;
}

export function DataStructuresRoadmap() {
  const steps: GuidedStep[] = [
    {
      id: "stack",
      title: "Estruturas: Stack",
      lesson: ["push/pop", "LIFO (Last In First Out)", "Array ou linked list"],
      taskPrompt: "Classe Stack com push/pop/peek",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof Stack === 'function' ? Stack : null;`);
          const Stack = fn();
          if (!Stack) return { ok: false, messages: ["Defina Stack"] };
          const s = new (Stack as any)();
          s.push(1); s.push(2); const v = s.pop();
          if (v === 2) return { ok: true, messages: ["Perfeito! Stack LIFO funcionando corretamente."] };
          return { ok: false, messages: ["Stack não funciona como esperado"] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "queue",
      title: "Estruturas: Queue",
      lesson: ["enqueue/dequeue", "FIFO (First In First Out)", "Útil para BFS"],
      taskPrompt: "Classe Queue com enqueue/dequeue/peek",
      check: (code) => {
        try {
          const fn = new Function(`${code}; return typeof Queue === 'function' ? Queue : null;`);
          const Queue = fn();
          if (!Queue) return { ok: false, messages: ["Defina Queue"] };
          const q = new (Queue as any)();
          q.enqueue(1); q.enqueue(2); const v = q.dequeue();
          if (v === 1) return { ok: true, messages: ["Excelente! Queue FIFO implementada."] };
          return { ok: false, messages: ["Queue não funciona como esperado"] };
        } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
      },
    },
    {
      id: "linked-list",
      title: "Estruturas: Linked List",
      lesson: ["Node com value/next", "Insert/Delete/Traverse", "Melhor para inserções frequentes"],
      taskPrompt: "Classe LinkedList com append/remove/traverse",
      check: (code) => {
        const hasNode = /Node|node|next/.test(code);
        const hasMethods = /append|remove|traverse/.test(code);
        if (hasNode && hasMethods) {
          return { ok: true, messages: ["Bom! Linked List estruturada."] };
        }
        return { ok: false, messages: ["Implemente Node, append, remove e traverse"] };
      },
    },
    {
      id: "hash-table",
      title: "Estruturas: Hash Table",
      lesson: ["Hash function", "Collision handling", "O(1) average lookup"],
      taskPrompt: "Hash Table simples com get/set",
      check: (code) => {
        const hasHash = /hash|key|value|put|get/.test(code);
        if (hasHash) {
          return { ok: true, messages: ["Excelente! Hash table básica implementada."] };
        }
        return { ok: false, messages: ["Implemente funções get/set com hash"] };
      },
    },
    {
      id: "binary-search-tree",
      title: "Estruturas: Binary Search Tree",
      lesson: ["Node com left/right", "Insert mantém ordem", "In-order traversal para ordem"],
      taskPrompt: "BST com insert/search/inorder",
      check: (code) => {
        const hasNode = /left|right/.test(code);
        const hasMethods = /insert|search/.test(code);
        if (hasNode && hasMethods) {
          return { ok: true, messages: ["Perfeito! BST com operações básicas."] };
        }
        return { ok: false, messages: ["Implemente BST com insert e search"] };
      },
    },
  ];
  return <GuidedPath id="datastruct-roadmap" title="Pro Roadmap: Estruturas" steps={steps} />;
}
