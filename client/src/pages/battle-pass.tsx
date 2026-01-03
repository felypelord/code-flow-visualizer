import Layout from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Flame, Trophy, Sparkles, Star, Shield, Gift, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const tiers = [
  { tier: 1, xp: 0, free: "50 Coins", premium: "150 Coins" },
  { tier: 5, xp: 1000, free: "Title: Rookie", premium: "Avatar 🦊" },
  { tier: 10, xp: 2000, free: "100 Coins", premium: "Avatar 🦄 (Epic)" },
  { tier: 15, xp: 3000, free: "XP Boost +10% (24h)", premium: "Animated Gold Frame" },
  { tier: 20, xp: 4000, free: "150 Coins", premium: "Name Effect: Gold" },
  { tier: 25, xp: 5000, free: "Title: Challenger", premium: "Name Effect: Rainbow" },
  { tier: 35, xp: 7000, free: "XP Boost +20% (48h)", premium: "Avatar 🐉 (Legendary)" },
  { tier: 50, xp: 10000, free: "Title: T1 Legend", premium: "Bundle 🐉 + Flaming Frame + 5000 Coins" },
];

const rewardsLegend = [
  { label: "Coins", color: "from-amber-400 to-yellow-300" },
  { label: "Avatars", color: "from-purple-500 to-fuchsia-500", icon: "🦊" },
  { label: "Frames", color: "from-orange-500 to-amber-500", icon: "🖼️" },
  { label: "Name Effects", color: "from-emerald-400 to-teal-400", icon: "✨" },
  { label: "Boosts", color: "from-sky-400 to-cyan-400", icon: "⚡" },
];

// Cosmetics display data
const COSMETICS_SHOWCASE = {
  avatars: [
    { tier: 5, name: "Avatar 🦊", rarity: "common" },
    { tier: 10, name: "Avatar 🦄 (Epic)", rarity: "epic" },
    { tier: 35, name: "Avatar 🐉 (Legendary)", rarity: "legendary" },
  ],
  frames: [
    { tier: 15, name: "Animated Gold Frame", rarity: "rare" },
    { tier: 50, name: "Flaming Frame", rarity: "legendary" },
  ],
  nameEffects: [
    { tier: 20, name: "Name Effect: Gold", rarity: "rare" },
    { tier: 25, name: "Name Effect: Rainbow", rarity: "epic" },
  ],
};

export default function BattlePassPage() {
  const { user, token, refreshUser } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const hasBattlePass = user?.battlePassActive ?? false;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id") || params.get("sessionId");
    if (!sessionId) return;

    // Best-effort: if the user returns from Stripe, confirm/activate battle pass.
    // This is safe server-side: activation requires a paid session matching this user.
    const run = async () => {
      try {
        if (!token) return;

        const res = await fetch("/api/battle-pass/activate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({
            title: t('battlePass.toast.activationFailedWithCode', 'Battle Pass activation failed ({{status}})', { status: res.status }),
            description: data?.message || t('battlePass.toast.couldNotConfirmPurchase', 'Could not confirm purchase.'),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t('battlePass.toast.activated.title', 'Battle Pass activated'),
          description: t('battlePass.toast.activated.desc', 'Your premium rewards are now unlocked.'),
        });

        await refreshUser();
      } catch (err: any) {
        toast({
          title: t('battlePass.toast.activationFailed.title', 'Battle Pass activation failed'),
          description: err?.message || t('common.unexpectedError', 'Unexpected error.'),
          variant: "destructive",
        });
      } finally {
        // Clean URL (remove session_id) to avoid re-running on refresh.
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("session_id");
          url.searchParams.delete("sessionId");
          window.history.replaceState({}, "", url.toString());
        } catch {
          // ignore
        }
      }
    };

    void run();
  }, [token, refreshUser, toast]);

  // Simple mapping: every 200 XP = +1 tier; 50 tiers max
  const tierFromXP = Math.min(50, Math.max(1, Math.floor(xp / 200) + 1));
  const xpForCurrentTier = (tierFromXP - 1) * 200;
  const xpForNextTier = tierFromXP * 200;
  const completion = Math.min(100, Math.round(((xp - xpForCurrentTier) / (xpForNextTier - xpForCurrentTier || 1)) * 100));

  const progress = useMemo(() => ({
    currentTier: tierFromXP,
    currentXP: xp,
    nextTierXP: xpForNextTier,
    completion,
    isPremium: hasBattlePass,
    level,
  }), [tierFromXP, xp, xpForNextTier, completion, hasBattlePass, level]);

  const handlePurchaseBattlePass = async () => {
    if (!user) {
      toast({
        title: t('auth.signIn.title', 'Sign in'),
        description: t('battlePass.toast.mustSignInToBuy', 'You must be signed in to buy the Battle Pass.'),
        variant: "destructive",
      });
      return;
    }
    try {
      console.log("[BATTLE_PASS] Starting purchase...");
      const token = localStorage.getItem("token");

      if (!token) {
        toast({
          title: t('auth.sessionExpired.title', 'Session expired'),
          description: t('auth.sessionExpired.desc', 'Please sign in again to continue.'),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ product: "battle_pass" }),
      });
      
      console.log("[BATTLE_PASS] Response status:", res.status);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        data = { message: text || "Invalid server response" };
      }

      console.log("[BATTLE_PASS] Response data:", data);
      
      if (!res.ok) {
        toast({
          title: t('common.errorWithCode', 'Error {{status}}', { status: res.status }),
          description: data?.message || t('battlePass.toast.failedStartCheckout', 'Failed to start checkout.'),
          variant: "destructive",
        });
        return;
      }
      
      if (data.url) {
        console.log("[BATTLE_PASS] Redirecionando para:", data.url);
        toast({
          title: t('common.redirecting', 'Redirecting'),
          description: t('battlePass.toast.openingCheckout', 'Opening Battle Pass checkout...'),
        });
        window.location.href = data.url;
      } else {
        toast({
          title: t('battlePass.toast.couldNotCreateCheckout.title', 'Could not create checkout'),
          description: data?.message || t('common.tryAgainSoon', 'Please try again in a moment.'),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("[BATTLE_PASS] Error:", err);
      toast({
        title: t('common.error', 'Error'),
        description: err?.message || t('battlePass.toast.unexpectedStartCheckout', 'Unexpected error while starting checkout.'),
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="container mx-auto px-4 py-12 space-y-10">
          {/* Hero */}
          <Card className="relative overflow-hidden border-amber-500/40 bg-gradient-to-br from-[#1a0f2b] via-[#0f172a] to-[#0b1220] shadow-[0_0_40px_rgba(255,215,0,0.12)]">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,0,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.12),transparent_30%)]" />
            <div className="relative grid lg:grid-cols-2 gap-10 p-8 lg:p-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" /> {t('battlePass.hero.seasonRemaining', 'Season 1 • 45 days remaining')}
                </div>
                <h1 className="text-4xl lg:text-5xl font-black leading-tight text-amber-100 drop-shadow-[0_10px_40px_rgba(255,193,7,0.25)]">
                  {t('battlePass.hero.title', 'Battle Pass CodeFlow')}
                </h1>
                <p className="text-slate-200 text-lg max-w-2xl">
                  {t('battlePass.hero.subtitle', 'Unlock 50 tiers of premium rewards, legendary avatars, golden frames, and animated name effects. Progress as you study and practice daily challenges.')}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  {hasBattlePass ? (
                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold shadow-lg">
                      <Shield className="w-5 h-5" /> {t('battlePass.hero.active', 'Battle Pass Active')}
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold hover:from-amber-300 hover:to-orange-400 shadow-[0_10px_40px_rgba(255,193,7,0.35)]"
                      onClick={handlePurchaseBattlePass}
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      {t('battlePass.actions.buy', 'Buy Battle Pass - $5')}
                    </Button>
                  )}
                  <div className="flex items-center gap-3 text-sm text-amber-100/90">
                    <Crown className="w-5 h-5 text-amber-300" />
                    {t('battlePass.hero.premiumIncludes', 'Premium pass includes all gold rewards.')}
                  </div>
                  {!user && (
                    <div className="text-sm text-amber-100/80 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                      {t('battlePass.hero.signInToSave', 'Sign in to save your tier progress.')}
                    </div>
                  )}
                </div>
              </div>

              <Card className="relative bg-white/5 border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_35%)]" />
                <div className="relative p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('battlePass.progress.label', 'Progress')}</p>
                      
                      <div className="flex items-center gap-2 text-lg font-bold text-amber-200">
                        {t('battlePass.progress.tierOf', 'Tier {{current}}/50', { current: progress.currentTier })}
                        <span className="text-xs font-medium text-slate-400">{progress.currentXP} XP</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${progress.isPremium ? 'bg-amber-500/15 border-amber-400/30 text-amber-200' : 'bg-white/5 border-white/10 text-slate-300'} border text-xs font-semibold`}>
                      <Shield className="w-4 h-4" /> {progress.isPremium ? t('battlePass.badge.premium', 'Premium') : t('battlePass.badge.free', 'Free')}
                    </div>
                  </div>
                  <Progress value={progress.completion} className="h-3 bg-amber-500/15" />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{progress.currentXP} XP</span>
                    <span>{progress.nextTierXP} XP</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-400/30 p-3">
                      <div className="text-2xl font-bold text-amber-200">+25k</div>
                      <div className="text-xs text-slate-300">{t('battlePass.stats.coinsInRewards', 'Coins in rewards')}</div>
                    </div>
                    <div className="rounded-lg bg-purple-500/10 border border-purple-400/30 p-3">
                      <div className="text-2xl font-bold text-purple-200">12</div>
                      <div className="text-xs text-slate-300">{t('battlePass.stats.avatarsFrames', 'Avatars/frames')}</div>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 border border-blue-400/30 p-3">
                      <div className="text-2xl font-bold text-blue-200">5</div>
                      <div className="text-xs text-slate-300">{t('battlePass.stats.xpBoosts', 'XP boosts')}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

          {/* Rewards Legend */}
          <div className="grid md:grid-cols-5 gap-3">
            {rewardsLegend.map((item) => (
              <div key={item.label} className={`p-3 rounded-xl border border-white/10 bg-gradient-to-r ${item.color} text-slate-950 font-semibold text-center shadow-lg`}>
                <div className="text-xl mb-1">{item.icon}</div>
                {item.label}
              </div>
            ))}
          </div>

          {/* Cosmetics Showcase */}
          <Card className="bg-slate-900/70 border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('battlePass.cosmeticsHighlights.label', 'Cosmetics Highlights')}</p>
              <h2 className="text-2xl font-bold text-purple-100">{t('battlePass.cosmeticsHighlights.title', 'Customize Your Profile')}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 p-6">
              {/* Avatars */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                  <span className="text-2xl">🦊</span> Avatars
                </h3>
                <div className="space-y-2">
                  {COSMETICS_SHOWCASE.avatars.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/30 hover:border-purple-400/60 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-100">{item.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.rarity === 'legendary' ? 'bg-orange-500/20 text-orange-200' :
                          item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-200' :
                          'bg-blue-500/20 text-blue-200'
                        }`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300/70">Tier {item.tier}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frames */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-orange-300 flex items-center gap-2">
                  <span className="text-2xl">🖼️</span> Frames
                </h3>
                <div className="space-y-2">
                  {COSMETICS_SHOWCASE.frames.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-orange-500/10 border border-orange-400/30 hover:border-orange-400/60 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-100">{item.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.rarity === 'legendary' ? 'bg-orange-500/20 text-orange-200' :
                          item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-200' :
                          'bg-blue-500/20 text-blue-200'
                        }`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-orange-300/70">Tier {item.tier}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name Effects */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                  <span className="text-2xl">✨</span> Name Effects
                </h3>
                <div className="space-y-2">
                  {COSMETICS_SHOWCASE.nameEffects.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 hover:border-emerald-400/60 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-100">{item.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.rarity === 'legendary' ? 'bg-orange-500/20 text-orange-200' :
                          item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-200' :
                          'bg-blue-500/20 text-blue-200'
                        }`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300/70">Tier {item.tier}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Tier Grid */}
          <Card className="bg-slate-900/70 border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('battlePass.tierGrid.season', 'Season 1')}</p>
                <h2 className="text-2xl font-bold text-amber-100">{t('battlePass.tierGrid.title', 'Tier Map (1-50)')}</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-100">
                <Crown className="w-5 h-5 text-amber-300" />
                {t('battlePass.tierGrid.premiumUnlocks', 'Premium track unlocks all gold items')}
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {tiers.map((tierItem) => (
                <div key={tierItem.tier} className="relative rounded-xl border border-amber-400/20 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-300/40 flex items-center justify-center text-lg text-amber-200 font-bold">
                        {tierItem.tier}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('battlePass.tierGrid.tierLabel', 'Tier')}</p>
                        <p className="text-sm text-slate-200">{tierItem.xp} XP</p>
                      </div>
                    </div>
                    {tierItem.tier >= 25 ? <Flame className="w-5 h-5 text-orange-400" /> : <Star className="w-5 h-5 text-yellow-300" />}
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                      <p className="text-xs text-slate-400">{t('battlePass.badge.free', 'Free')}</p>
                      <p className="text-sm font-semibold text-slate-100">{tierItem.free}</p>
                    </div>
                    <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-400/30 shadow-inner">
                      <p className="text-xs text-amber-200">{t('battlePass.badge.premium', 'Premium')}</p>
                      <p className="text-sm font-semibold text-amber-50">{tierItem.premium}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CTA */}
          {!hasBattlePass && (
            <Card className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-yellow-500/20 border border-amber-400/40 shadow-[0_20px_40px_rgba(255,193,7,0.25)]">
              <div className="p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-200">{t('battlePass.cta.premiumPassLabel', 'Premium Pass')}</p>
                  <h3 className="text-2xl font-black text-amber-50">{t('battlePass.cta.title', 'All gold rewards for only $5')}</h3>
                  <p className="text-amber-100/80 max-w-2xl">{t('battlePass.cta.desc', 'Includes 50 tiers, legendary avatars, animated frames, name effects, and 25k+ coins in rewards. No subscription — one-time seasonal purchase.')}</p>
                </div>
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-amber-100 font-semibold">
                    <Trophy className="w-5 h-5" /> {t('battlePass.cta.estimatedValue', 'Estimated total value: $40 in items')}
                  </div>
                  <Button size="lg" className="bg-slate-950 text-amber-300 border border-amber-400/40 hover:bg-slate-900" onClick={handlePurchaseBattlePass}>
                    <Crown className="w-5 h-5 mr-2" />
                    {t('battlePass.actions.buy', 'Buy Battle Pass - $5')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
