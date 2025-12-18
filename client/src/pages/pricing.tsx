import { useUser } from "@/hooks/use-user";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    description: "Perfeito para começar",
    features: [
      "✓ Acesso a lições básicas",
      "✓ Editor de código",
      "✓ Exercícios limitados (5 por dia)",
      "✓ 5 linguagens de programação",
      "✓ Comunidade",
    ],
    notIncluded: [
      "✗ Debugger avançado (Pro)",
      "✗ Certificados",
      "✗ Lições exclusivas",
      "✗ Suporte prioritário",
    ],
    cta: "Atual",
    ctaVariant: "secondary" as const,
    isFree: true,
  },
  {
    name: "Pro",
    price: "$2",
    period: "/mês (USD)",
    description: "Cobra em USD; seu banco converte para BRL ou outras moedas",
    badge: "Popular",
    features: [
      "✓ Tudo do plano Free",
      "✓ Debugger Python avançado",
      "✓ Exercícios ilimitados",
      "✓ Lições exclusivas",
      "✓ Certificados de conclusão",
      "✓ Histórico completo",
      "✓ Suporte prioritário",
      "✓ Comunidade VIP",
    ],
    notIncluded: [],
    cta: "Ativar Pro",
    ctaVariant: "default" as const,
    isPro: true,
  },
];

export default function PricingPage() {
  const { user, token } = useUser();
  const [, setLocation] = useLocation();
  const [billingPlan] = useState<"monthly">("monthly");
  const [secondsLeft, setSecondsLeft] = useState(3600); // 1h urgency banner

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

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
        body: JSON.stringify({ plan: billingPlan }),
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Planos de Assinatura</h1>
          <p className="text-xl text-gray-400">
            Escolha o plano perfeito para sua jornada de programação
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-200">
            <span className="font-semibold text-white">Pro: $2/mês</span>
            <span className="text-gray-300">Cobrança em USD; seu banco converte para BRL/outras moedas.</span>
          </div>

          <div className="mt-4 inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/80 to-orange-500/80 border border-red-500/50 text-sm text-white shadow-lg shadow-red-500/30">
            <span className="font-bold text-base">Oferta relâmpago</span>
            <span className="text-white/90">Ative o Pro agora por $2/mês e fixe o preço.</span>
            <span className="px-2 py-1 rounded bg-black/40 font-mono text-sm tracking-wide">{minutes}:{seconds}</span>
          </div>
        </div>

        {/* Single price: $2 USD/month; card conversion handles FX */}

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-8 border-2 transition-all ${
                plan.isPro
                  ? "border-purple-500 bg-slate-800/80 shadow-lg shadow-purple-500/20"
                  : "border-gray-700 bg-slate-800/40"
              }`}
            >
              {plan.isPro && (
                <div className="pointer-events-none absolute -right-12 -top-6 w-48 rotate-45 drop-shadow-xl">
                  <div
                    className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 text-white text-xs font-bold text-center py-2 border border-white/30"
                    style={{
                      clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Oferta relâmpago · {minutes}:{seconds}
                  </div>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">{plan.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  {plan.isPro ? (
                    <>
                      <span className="text-4xl font-bold text-white">$2.00</span>
                      <span className="text-gray-400">/month</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature.replace("✓ ", "")}</span>
                  </div>
                ))}

                {plan.notIncluded.length > 0 && (
                  <>
                    <div className="border-t border-gray-700 my-4" />
                    {plan.notIncluded.map((feature, i) => (
                      <div key={`not-${i}`} className="flex items-center gap-3 text-gray-500">
                        <span className="w-5 h-5 flex-shrink-0">✗</span>
                        <span className="line-through">{feature.replace("✗ ", "")}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* CTA Button */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    if (plan.isFree) return;
                    handleUpgrade();
                  }}
                  disabled={plan.isFree || (user?.isPro && plan.isPro)}
                  variant={plan.ctaVariant}
                  className="w-full py-2 font-semibold text-base"
                >
                  {user?.isPro && plan.isPro ? "✓ Ativo" : plan.cta}
                </Button>
                {user?.isPro && plan.isPro && (
                  <Button
                    onClick={handlePortal}
                    variant="secondary"
                    className="w-full py-2 font-semibold text-base"
                  >
                    Gerenciar assinatura
                  </Button>
                )}
                {plan.isPro && !user?.isPro && (
                  <div className="text-xs text-center space-y-1 text-gray-300">
                    <p>Cobrança em USD ($2/mês). Seu banco converte para BRL/outras moedas.</p>
                    <p className="text-red-300 font-semibold">Oferta relâmpago: preço fixo por tempo limitado.</p>
                    <p className="text-amber-200">Tempo restante: {minutes}:{seconds}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Perguntas Frequentes</h2>

          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-400">
                Sim! Você pode cancelar sua assinatura Pro a qualquer momento e terá acesso até o final do período pago.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">O que são "Exercícios ilimitados"?</h3>
              <p className="text-gray-400">
                Usuários Free podem fazer apenas 5 exercícios por dia. Usuários Pro podem fazer quantos quiserem, quando quiserem.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Preciso de cartão de crédito para começar?</h3>
              <p className="text-gray-400">
                Não! O plano Free é 100% gratuito e sem cartão de crédito. Você só precisa adicionar dados de pagamento quando quiser fazer upgrade para Pro.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Existe desconto anual?</h3>
              <p className="text-gray-400">
                Não. Mantemos o preço simples: $2/mês em USD, e seu banco faz a conversão para BRL ou outras moedas.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        {!user?.isPro ? (
          <div className="max-w-4xl mx-auto mt-16 text-center">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Comece a aprender hoje!</h2>
              <p className="text-purple-100 mb-6 text-lg">
                Desbloqueia novos exercícios, ferramentas avançadas e certificados com o plano Pro.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="font-bold text-lg px-8 py-6"
                onClick={handleUpgrade}
              >
                Ativar Pro Agora
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mt-16 text-center">
            <div className="bg-slate-800/60 border border-gray-700 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Você é Pro 🎉</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Gerencie sua assinatura, forma de pagamento e faturas no portal.
              </p>
              <Button size="lg" className="font-bold text-lg px-8 py-6" onClick={handlePortal}>
                Gerenciar assinatura
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
