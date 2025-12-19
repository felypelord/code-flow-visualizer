import React, { lazy, Suspense, useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3,
  Crown,
  Database,
  PauseCircle,
  Code2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProExercisesGrid } from "@/components/pro-exercises-grid";
import { getAllProExercises } from "@/lib/pro-exercises";
import { useLanguage } from "@/contexts/LanguageContext";

const ProDebuggerLazy = lazy(() =>
  import("@/components/visualizer/pro-debugger").then((m) => ({ default: m.ProDebugger }))
);

const AICodeInspectorLazy = lazy(() =>
  import("@/components/visualizer/ai-code-inspector").then((m) => ({ default: m.AICodeInspector }))
);

export default function ProPage() {
  const { user, refreshUser } = useUser();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [profilerCode, setProfilerCode] = useState(
    "function fib(n){ return n<=1 ? n : fib(n-1)+fib(n-2); }\nfunction main(){ return fib(15); }"
  );
  const [profilerRuns, setProfilerRuns] = useState<Array<{ run: number; ms: number; result?: any }>>([]);
  const [profilerError, setProfilerError] = useState<string | null>(null);

  const [breakpoints, setBreakpoints] = useState<Array<{ id: string; line: number; condition?: string; active: boolean }>>([
    { id: "bp-1", line: 12, condition: "i === 5", active: true },
    { id: "bp-2", line: 24, condition: "value > 100", active: false },
  ]);

  const [inspectorInput, setInspectorInput] = useState(
    '{\n  "user": {"name": "Ana", "level": 7},\n  "array": [1,2,3],\n  "flags": {"pro": true, "beta": false}\n}'
  );
  const [inspectorParsed, setInspectorParsed] = useState<any>(null);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [scratchpad, setScratchpad] = useState(
    "// VIP Playground\n// Rascunhe ideias ou pseudo-código rápido aqui.\nfunction snippet() {\n  return ['stack', 'heap', 'tests'];\n}"
  );

  const handleGoToPricing = () => setLocation("/pricing?vip=1");

  const logEvent = (name: string, payload?: Record<string, any>) => {
    try {
      console.info("[pro-analytics]", name, payload || {});
    } catch (_) {}
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const copyScratchpad = async () => {
    try {
      await navigator.clipboard.writeText(scratchpad);
      toast({ title: t.proPlaygroundCopied, description: t.proPlaygroundCopy });
    } catch (err) {
      toast({ title: t.proPlaygroundCopyFailed, description: String(err) });
    }
  };

  const clearScratchpad = () => setScratchpad("");

  const runProfiler = () => {
    try {
      const fn = new Function(
        "performance",
        `${profilerCode}; return typeof main === 'function' ? main() : undefined;`
      );
      const runs: Array<{ run: number; ms: number; result?: any }> = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const result = fn(performance);
        const end = performance.now();
        runs.push({ run: i + 1, ms: Number((end - start).toFixed(3)), result });
      }
      setProfilerRuns(runs);
      setProfilerError(null);
    } catch (e: any) {
      setProfilerError(e?.message || t.profilerError);
      setProfilerRuns([]);
    }
  };

  const toggleBreakpoint = (id: string) => {
    setBreakpoints((prev) => prev.map((bp) => (bp.id === id ? { ...bp, active: !bp.active } : bp)));
  };

  const addBreakpoint = () => {
    const nextId = `bp-${breakpoints.length + 1}`;
    setBreakpoints((prev) => [...prev, { id: nextId, line: 1, condition: "", active: true }]);
  };

  const parseInspector = () => {
    try {
      const parsed = JSON.parse(inspectorInput);
      setInspectorParsed(parsed);
      setInspectorError(null);
    } catch (e: any) {
      setInspectorError(e?.message || t.proInspectorInvalidJson);
      setInspectorParsed(null);
    }
  };

  const renderObject = (value: any, depth = 0) => {
    if (value === null) return <span className="text-amber-300">null</span>;
    if (typeof value === "boolean") return <span className="text-amber-300">{String(value)}</span>;
    if (typeof value === "number") return <span className="text-amber-300">{value}</span>;
    if (typeof value === "string") return <span className="text-emerald-200">"{value}"</span>;
    if (Array.isArray(value)) {
      return (
        <div className="pl-4 space-y-1">
          {value.map((v, idx) => (
            <div key={`${depth}-arr-${idx}`} className="text-gray-200 text-sm">
              <span className="text-gray-400">[{idx}]</span> {renderObject(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "object") {
      return (
        <div className="pl-4 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={`${depth}-${k}`} className="text-gray-200 text-sm">
              <span className="text-amber-300">{k}</span>: {renderObject(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-300">{String(value)}</span>;
  };

  // Finalize VIP signup after returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    const pendingRaw = sessionStorage.getItem("pendingSignup");
    if (!pendingRaw) return;

    (async () => {
      try {
        const cres = await fetch("/api/pro/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const cdata = await cres.json();
        if (!cres.ok || !cdata?.ok || !cdata?.proToken) {
          throw new Error(cdata?.error || "Pagamento não confirmado");
        }
        const proToken: string = cdata.proToken;

        const pending = JSON.parse(pendingRaw);
        const payload = {
          ...pending,
          proToken,
          // Ensure datetime format
          dateOfBirth: pending.dateOfBirth && pending.dateOfBirth.length <= 10
            ? new Date(pending.dateOfBirth + "T00:00:00.000Z").toISOString()
            : pending.dateOfBirth,
        };

        const sres = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const sdata = await sres.json();
        if (!sres.ok || !sdata?.ok) {
          throw new Error(sdata?.message || sdata?.error || "Falha ao criar conta VIP");
        }
        sessionStorage.removeItem("pendingSignup");
        // Auto-login
        try {
          const lres = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pending.email, password: pending.password }),
          });
          const ldata = await lres.json();
          if (lres.ok && ldata?.token) {
            localStorage.setItem("token", ldata.token);
            toast({ title: "Conta VIP criada", description: "Login realizado com sucesso." });
            window.location.reload();
            return;
          }
        } catch {}
        toast({ title: "Conta VIP criada", description: "Verifique seu email para ativar a conta." });
        await refreshUser();
      } catch (err: any) {
        toast({ title: "Erro", description: err?.message || String(err) });
      }
    })();
  }, [refreshUser]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 py-12">
        {/* Header (Learning-only) */}
        <div className="max-w-5xl mx-auto px-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl shadow-amber-500/20">
            <div className="space-y-3 text-center text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-300/40 text-amber-200 text-xs font-semibold">
                <Crown className="w-4 h-4" /> VIP
              </div>
              <h1 className="text-3xl font-bold">
                <span className="relative inline-block">
                  <Crown className="absolute -top-8 left-1 -rotate-12 w-10 h-10 text-amber-300 drop-shadow-[0_0_12px_rgba(255,215,0,0.45)]" />
                  <span className="block px-3 py-1 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 text-transparent bg-clip-text drop-shadow-[0_0_18px_rgba(255,214,102,0.35)]">
                    {t.proLearningTitle}
                  </span>
                </span>
              </h1>
              <p className="text-sm text-amber-100/90">{t.proLearningSubtitle}</p>
            </div>
          </div>
        </div>

        {/* VIP workspace shortcuts */}
        <div className="max-w-6xl mx-auto px-4 mb-14">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5 bg-white/5 border-white/10 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-200">{t.proChallengesBadge}</span>
              </div>
              <h3 className="text-lg font-bold mb-1">{t.proChallengesSubtitle}</h3>
              <p className="text-sm text-gray-300 mb-4">{t.proLearningSubtitle}</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => scrollToSection("pro-exercises")}
              >
                {t.start}
              </Button>
            </Card>

            <Card className="p-5 bg-white/5 border-white/10 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-200">{t.aiCodeInspectorTitle}</span>
              </div>
              <h3 className="text-lg font-bold mb-1">{t.aiCodeInspector}</h3>
              <p className="text-sm text-gray-300 mb-4">{t.aiCodeInspectorDesc}</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => scrollToSection("ai-inspector")}
              >
                {t.analyze}
              </Button>
            </Card>

            <Card className="p-5 bg-white/5 border-white/10 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-200">{t.proFeatureDebuggerTitle}</span>
              </div>
              <h3 className="text-lg font-bold mb-1">{t.premiumBadge}</h3>
              <p className="text-sm text-gray-300 mb-4">{t.proDebuggerRequiresText}</p>
              <Button
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold"
                onClick={handleGoToPricing}
              >
                {t.viewPricing}
              </Button>
            </Card>
          </div>
        </div>

        {/* VIP Playground */}
        <div id="vip-playground" className="max-w-6xl mx-auto px-4 mb-14">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-900/40 via-slate-900 to-slate-950 p-6">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/10 blur-3xl" />
              <div className="absolute -bottom-12 -right-6 w-32 h-32 bg-purple-500/10 blur-3xl" />
              <div className="relative z-10 space-y-3 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                  <Crown className="w-4 h-4" />
                  {t.proPlaygroundTitle}
                </div>
                <h3 className="text-2xl font-bold">{t.proPlaygroundTitle}</h3>
                <p className="text-sm text-amber-100/90">{t.proPlaygroundSubtitle}</p>
                <div className="space-y-2 text-sm text-amber-50/90">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 mt-0.5" />
                    <span>{t.proPlaygroundIdea1}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 mt-0.5" />
                    <span>{t.proPlaygroundIdea2}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 mt-0.5" />
                    <span>{t.proPlaygroundIdea3}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="bg-white/10 text-white border border-amber-300/40" onClick={() => scrollToSection("pro-exercises")}>
                    {t.start}
                  </Button>
                  <Button variant="outline" className="border-amber-400/50 text-amber-100" onClick={() => scrollToSection("pro-labs")}>
                    {t.proMiniDemosBadge}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/25 bg-black/40 backdrop-blur-sm p-6 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-300" />
                  <span className="font-semibold">{t.proPlaygroundTitle}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="bg-amber-500/80 text-black font-semibold" onClick={copyScratchpad}>
                    {t.proPlaygroundCopy}
                  </Button>
                  <Button size="sm" variant="outline" className="border-amber-300/60 text-amber-100" onClick={clearScratchpad}>
                    {t.proPlaygroundClear}
                  </Button>
                </div>
              </div>
              <textarea
                className="w-full h-48 rounded-xl bg-slate-950/60 border border-amber-400/25 text-sm text-amber-50 p-3 font-mono"
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                placeholder={t.proPlaygroundPlaceholder}
              />
              <p className="text-xs text-amber-100/80">{t.proPlaygroundPlaceholder}</p>
            </div>
          </div>
        </div>

        {/* Pro Exercises Section */}
        <div id="pro-exercises" className="max-w-6xl mx-auto px-4 mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                <Code2 className="w-4 h-4" />
                {t.proChallengesBadge}
              </span>
              <p className="text-sm text-gray-400">{t.proChallengesSubtitle}</p>
            </div>
          </div>

          <ProExercisesGrid
            exercises={getAllProExercises()}
            completedIds={[]}
            onSelectExercise={(ex) => {
              toast({ title: `${t.proFeature}: ${ex.title}`, description: t.proChallengesSubtitle });
            }}
          />
        </div>

        {/* IA Code Inspector - Full Feature */}
        <div id="ai-inspector" className="max-w-6xl mx-auto px-4 mb-16">
          <Suspense
            fallback={
              <div className="text-center text-white/60 py-10">
                {t.analyzing}
              </div>
            }
          >
            <AICodeInspectorLazy />
          </Suspense>
        </div>

        <div id="pro-labs" className="max-w-6xl mx-auto px-4 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              {t.proMiniDemosBadge}
            </span>
            <p className="text-sm text-gray-400">{t.proMiniDemosNote}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold">Code Profiler</h3>
              </div>
              <textarea
                className="w-full h-32 rounded-lg bg-black/40 border border-amber-400/20 text-sm text-white p-3 font-mono"
                value={profilerCode}
                onChange={(e) => setProfilerCode(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button onClick={runProfiler} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  {`${t.runProfiler} x5`}
                </Button>
                {profilerError && <span className="text-sm text-red-300">{profilerError}</span>}
              </div>
              {profilerRuns.length > 0 && (
                <div className="bg-black/30 border border-amber-400/10 rounded-lg p-3 text-sm text-gray-200 space-y-1">
                  {profilerRuns.map((r) => (
                    <div key={r.run} className="flex items-center justify-between">
                      <span className="text-gray-400">Run {r.run}</span>
                      <span className="font-semibold text-amber-300">{r.ms} ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold">Breakpoint Manager</h3>
              </div>
              <div className="space-y-2">
                {breakpoints.map((bp) => (
                  <div key={bp.id} className="flex items-center gap-2 text-sm text-gray-200 bg-black/30 border border-amber-400/10 rounded-lg p-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bp.active}
                        onChange={() => toggleBreakpoint(bp.id)}
                        className="accent-amber-400"
                      />
                      <span className="text-amber-200 font-semibold">L{bp.line}</span>
                    </label>
                    <input
                      className="flex-1 bg-transparent border border-amber-400/20 rounded px-2 py-1 text-xs text-gray-200"
                      value={bp.condition || ""}
                      onChange={(e) =>
                        setBreakpoints((prev) => prev.map((b) => (b.id === bp.id ? { ...b, condition: e.target.value } : b)))
                      }
                      placeholder="condition"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={addBreakpoint} variant="outline" className="border-amber-400/40 text-amber-200">
                + Add breakpoint
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold">Variable Inspector</h3>
            </div>
            <textarea
              className="w-full h-32 rounded-lg bg-black/40 border border-amber-400/20 text-sm text-white p-3 font-mono"
              value={inspectorInput}
              onChange={(e) => setInspectorInput(e.target.value)}
              placeholder={t.proInspectorPlaceholder}
            />
            <div className="flex items-center gap-2">
              <Button onClick={parseInspector} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                {t.proInspectorAnalyze}
              </Button>
              {inspectorError && <span className="text-sm text-red-300">{inspectorError}</span>}
            </div>
            <div className="bg-black/30 border border-amber-400/10 rounded-lg p-3 min-h-[120px] text-sm text-gray-200">
              {inspectorParsed ? renderObject(inspectorParsed) : <span className="text-gray-500">{t.proInspectorPlaceholder}</span>}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12">
          {user?.isPro ? (
            <Suspense fallback={<div className="text-center p-8 text-white">{t.proDebuggerLoading}</div>}>
              <ProDebuggerLazy />
            </Suspense>
          ) : (
            <div className="max-w-4xl mx-auto text-center text-white space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                <Crown className="w-4 h-4" />
                {t.proDebuggerRequiresBadge}
              </div>
              <p className="text-gray-200">{t.proDebuggerRequiresText}</p>
              <Button onClick={handleGoToPricing} className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold h-12">
                {t.viewPricing}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

