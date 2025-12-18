import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
  const [confirming, setConfirming] = useState(false);
  const [proToken, setProToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const sid = urlParams.get("session_id");
    if (sid) {
      setConfirming(true);
      fetch("/api/pro/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json())?.error || "Falha ao confirmar pagamento");
          return r.json();
        })
        .then((data) => {
          setProToken(data?.proToken || null);
          setError(null);
        })
        .catch((e) => setError(e?.message || "Erro ao confirmar"))
        .finally(() => setConfirming(false));
    }
  }, [urlParams]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/pro/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly", currency: "BRL", email: user?.email }),
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
    alert("Portal de cobrança ainda não configurado.");
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

        {error && (
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="bg-red-500/15 border border-red-400/40 text-red-200 rounded-xl p-4">
              {error}
            </div>
          </div>
        )}

        {confirming && (
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">Confirmando pagamento...</div>
          </div>
        )}

        {proToken && (
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 rounded-xl p-4 space-y-2">
              <div className="font-semibold">Pagamento confirmado!</div>
              <div className="text-sm">Seu código Pro foi gerado. Use esse código ao criar sua conta:</div>
              <div className="font-mono text-white bg-black/30 px-3 py-2 rounded">{proToken}</div>
              <div>
                <Button onClick={() => navigator.clipboard.writeText(proToken)} size="sm">Copiar código</Button>
              </div>
            </div>
          </div>
        )}

        {user?.isPro ? (
          <Suspense fallback={<div className="text-center p-8 text-white">Carregando debugger...</div>}>
            <ProDebuggerLazy />
          </Suspense>
        ) : (
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Recurso Pro</h2>
              <p className="text-sm text-gray-200/80 mb-4">Faça o upgrade para desbloquear o Pro Debugger e conteúdos exclusivos.</p>
              <Button onClick={handleUpgrade}>Ativar Pro</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
