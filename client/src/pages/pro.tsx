import { lazy, Suspense, useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";

const ProDebuggerLazy = lazy(() =>
  import("@/components/visualizer/pro-debugger").then((m) => ({ default: m.ProDebugger }))
);

export default function ProPage() {
  const { user, token } = useUser();
  const [, setLocation] = useLocation();
  const [secondsLeft, setSecondsLeft] = useState(3600);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const handleUpgrade = async () => {
    if (!token) {
      setLocation("/");
      return;
    }
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "monthly" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      alert("Erro ao iniciar checkout");
    } catch (err) {
      alert("Erro na requisição");
    }
  };

  const handlePortal = async () => {
    if (!token) {
      setLocation("/");
      return;
    }
    try {
      const res = await fetch("/api/billing/portal", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      alert("Não foi possível abrir o portal de cobrança");
    } catch (err) {
      alert("Erro ao abrir o portal");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 py-12">
        <div className="max-w-5xl mx-auto px-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/40 text-sm font-semibold">
                  Oferta relâmpago
                  <span className="px-2 py-0.5 rounded bg-black/40 font-mono text-xs tracking-wide">
                    {minutes}:{seconds}
                  </span>
                </div>
                <h1 className="text-3xl font-bold">Pro Debugger + Conteúdo Exclusivo</h1>
                <p className="text-sm text-gray-200/80">
                  Pro custa $2/mês (USD). Seu banco converte para BRL ou outras moedas. Bloqueie este preço enquanto o timer estiver ativo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {user?.isPro ? (
                  <Button onClick={handlePortal} variant="secondary" className="w-full sm:w-auto">
                    Gerenciar assinatura
                  </Button>
                ) : (
                  <Button onClick={handleUpgrade} className="w-full sm:w-auto">
                    Ativar Pro por $2/mês
                  </Button>
                )}
                <div className="text-xs text-gray-300 text-center sm:text-left">
                  Acesso imediato ao debugger avançado + exercícios ilimitados.
                </div>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="text-center p-8 text-white">Carregando debugger...</div>}>
          <ProDebuggerLazy />
        </Suspense>
      </div>
    </Layout>
  );
}
