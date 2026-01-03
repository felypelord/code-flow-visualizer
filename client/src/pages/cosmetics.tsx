import Layout from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Rainbow, Flame, Shield, Crown, ShoppingCart, Check } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type CosmeticCatalogItem = {
  id: string;
  name: string;
  description: string;
  type: "cosmetic";
  category: "avatar" | "frame" | "name_effect" | "theme" | "badge" | "emote" | "pet" | string;
  price: number;
  icon?: string;
  owned?: boolean;
};

function getRarity(price: number): { label: string } {
  if (price >= 600) return { label: "Legendary" };
  if (price >= 300) return { label: "Epic" };
  if (price >= 150) return { label: "Rare" };
  return { label: "Common" };
}

const CATEGORY_META: Array<{
  category: CosmeticCatalogItem["category"];
  title: string;
  subtitle: string;
  icon: ReactNode;
  equipable: boolean;
  columns: string;
}> = [
  {
    category: "avatar",
    title: "Avatars",
    subtitle: "Choose your identity",
    icon: <Sparkles className="w-5 h-5 text-purple-300" />,
    equipable: true,
    columns: "grid md:grid-cols-2 lg:grid-cols-3 gap-4",
  },
  {
    category: "frame",
    title: "Frames",
    subtitle: "Frame your profile",
    icon: <Crown className="w-5 h-5 text-yellow-300" />,
    equipable: true,
    columns: "grid md:grid-cols-2 lg:grid-cols-4 gap-4",
  },
  {
    category: "name_effect",
    title: "Name Effects",
    subtitle: "Make your name shine",
    icon: <Rainbow className="w-5 h-5 text-fuchsia-300" />,
    equipable: true,
    columns: "grid md:grid-cols-2 lg:grid-cols-3 gap-4",
  },
  {
    category: "theme",
    title: "Themes",
    subtitle: "Change the app vibe",
    icon: <Flame className="w-5 h-5 text-orange-300" />,
    equipable: true,
    columns: "grid md:grid-cols-2 lg:grid-cols-3 gap-4",
  },
  {
    category: "badge",
    title: "Badges",
    subtitle: "Collectibles to show progress",
    icon: <Shield className="w-5 h-5 text-sky-300" />,
    equipable: true,
    columns: "grid md:grid-cols-2 lg:grid-cols-3 gap-4",
  },
  {
    category: "emote",
    title: "Emotes & Stickers",
    subtitle: "Collectibles for your profile",
    icon: <Sparkles className="w-5 h-5 text-purple-300" />,
    equipable: false,
    columns: "grid md:grid-cols-2 lg:grid-cols-3 gap-4",
  },
  {
    category: "pet",
    title: "Pets",
    subtitle: "Companions for your achievements",
    icon: <Sparkles className="w-5 h-5 text-purple-300" />,
    equipable: false,
    columns: "grid md:grid-cols-2 lg:grid-cols-3 gap-4",
  },
];

export default function CosmeticsPage() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<any>(null);
  const [catalog, setCatalog] = useState<CosmeticCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equippedItems, setEquippedItems] = useState({
    avatar: "default",
    frame: null,
    frameAnimation: null,
    nameEffect: null,
    theme: null,
    badge: null,
  });

  const FRAME_ANIMATIONS: Array<{ id: string; label: string }> = [
    { id: "rotate", label: "Rotating" },
    { id: "pulse", label: "Pulsing" },
    { id: "shimmer", label: "Shimmer" },
    { id: "glow", label: "Glow" },
    { id: "wave", label: "Wave" },
    { id: "bounce", label: "Bounce" },
    { id: "wobble", label: "Wobble" },
    { id: "tilt", label: "Tilt" },
    { id: "zoom", label: "Zoom" },
    { id: "flicker", label: "Flicker" },
  ];

  const frameRingClass = (frameId: string | null | undefined) => {
    switch (frameId) {
      case "frame_gold":
        return "avatar-frame--gold";
      case "frame_silver":
        return "avatar-frame--silver";
      case "frame_rainbow":
        return "avatar-frame--rainbow";
      case "frame_neon":
        return "avatar-frame--neon";
      case "frame_onyx":
        return "avatar-frame--onyx";
      case "frame_animated":
        return "avatar-frame--animated";
      default:
        return "";
    }
  };

  const frameAnimClass = (animationId: string | null | undefined) => {
    switch (animationId) {
      case "rotate":
        return "frame-anim-rotate";
      case "pulse":
        return "frame-anim-pulse";
      case "shimmer":
        return "frame-anim-shimmer";
      case "glow":
        return "frame-anim-glow";
      case "wave":
        return "frame-anim-wave";
      case "bounce":
        return "frame-anim-bounce";
      case "wobble":
        return "frame-anim-wobble";
      case "tilt":
        return "frame-anim-tilt";
      case "zoom":
        return "frame-anim-zoom";
      case "flicker":
        return "frame-anim-flicker";
      default:
        return "";
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (user) loadInventory();
    // If user changes (login/logout), re-fetch catalog to include ownership flags when available.
    loadCatalog();
  }, [user]);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/cosmetics/catalog", {
        headers,
        credentials: "include",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        data = { message: text || "Invalid server response" };
      }

      if (!res.ok) {
        toast({
          title: `Error ${res.status}`,
          description: data?.message || "Failed to load catalog.",
          variant: "destructive",
        });
        return;
      }

      setCatalog((data?.items || []) as CosmeticCatalogItem[]);
    } catch (err: any) {
      console.error("Error loading catalog:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to load catalog.",
        variant: "destructive",
      });
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/cosmetics/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        data = { message: text || "Invalid server response" };
      }

      if (!res.ok) {
        toast({
          title: `Error ${res.status}`,
          description: data?.message || "Failed to load inventory.",
          variant: "destructive",
        });
        return;
      }
      setInventory(data);
      setEquippedItems(data.equipped || {});
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to load inventory.",
        variant: "destructive",
      });
    }
  };

  const handleBuyCosmeticWithCoins = async (itemId: string, itemName: string, price: number) => {
    if (!user) {
      toast({
        title: t('auth.signIn', 'Sign in'),
        description: t('cosmetics.toast.mustSignInToBuy', 'You must be signed in to buy cosmetics.'),
        variant: "destructive",
      });
      return;
    }

    if ((user.coins || 0) < price) {
      toast({
        title: "Not enough coins",
        description: `You need ${price} coins. You have ${user.coins || 0} coins.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: t('auth.sessionExpired.title', 'Session expired'),
          description: t('auth.sessionExpired.desc', 'Please sign in again to continue.'),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/cosmetics/buy-with-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ itemId }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        data = { message: text || "Invalid server response" };
      }
      if (!res.ok) {
        toast({
          title: "Purchase failed",
          description: data?.message || "Could not complete the purchase.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Purchase successful", description: `${itemName} purchased!` });
      await refreshUser();
      await loadInventory();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Unexpected error while purchasing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquipCosmetic = async (itemId: string, itemName: string, opts?: { frameAnimation?: string }) => {
    if (!user) {
      toast({
        title: t('auth.signIn', 'Sign in'),
        description: t('cosmetics.toast.mustSignInToEquip', 'You must be signed in to equip cosmetics.'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: t('auth.sessionExpired.title', 'Session expired'),
          description: t('auth.sessionExpired.desc', 'Please sign in again to continue.'),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/cosmetics/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ itemId, ...(opts?.frameAnimation ? { frameAnimation: opts.frameAnimation } : {}) }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        data = { message: text || "Invalid server response" };
      }
      if (!res.ok) {
        toast({
          title: "Equip failed",
          description: data?.message || "Could not equip the item.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Equipped", description: `${itemName} equipped!` });
      setEquippedItems(data.equipped);
      await refreshUser();
      await loadInventory();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Unexpected error while equipping.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getItem = (itemId: string) => catalog.find((i) => i.id === itemId) || inventory?.owned?.find((i: any) => i.id === itemId);

  const isOwned = (itemId: string) => {
    if (inventory?.owned) return inventory.owned.some((item: any) => item.id === itemId);
    const c = catalog.find((i) => i.id === itemId);
    return Boolean(c?.owned);
  };

  const isEquipped = (itemId: string) => {
    if (itemId.startsWith("frame_")) return equippedItems.frame === itemId;
    if (itemId.startsWith("name_effect_")) return equippedItems.nameEffect === itemId;
    if (itemId.startsWith("theme_")) return equippedItems.theme === itemId;
    if (itemId.startsWith("avatar_")) return equippedItems.avatar === itemId.replace("avatar_", "");
    if (itemId.startsWith("badge_")) return equippedItems.badge === itemId;
    return false;
  };

  const displayName =
    (user as any)?.firstName
      ? `${(user as any).firstName}${(user as any).lastName ? ` ${(user as any).lastName}` : ""}`
      : (user as any)?.email || "Seu Nome";

  const equippedAvatarId = equippedItems.avatar && equippedItems.avatar !== "default" ? `avatar_${equippedItems.avatar}` : null;
  const equippedAvatar = equippedAvatarId ? getItem(equippedAvatarId) : null;
  const equippedFrame = equippedItems.frame ? getItem(equippedItems.frame) : null;
  const equippedNameEffect = equippedItems.nameEffect ? getItem(equippedItems.nameEffect) : null;
  const equippedTheme = equippedItems.theme ? getItem(equippedItems.theme) : null;
  const equippedBadge = equippedItems.badge ? getItem(equippedItems.badge) : null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="container mx-auto px-4 py-12 space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cosmetics</p>
              <h1 className="text-4xl font-black text-amber-100 drop-shadow-[0_10px_40px_rgba(255,193,7,0.18)]">
                Customize your Profile
              </h1>
              <p className="text-slate-200 mt-2 max-w-2xl">Buy and equip frames, name effects, themes, and avatars with coins.</p>
            </div>
            {user && (
              <div className="text-right">
                <div className="text-sm text-slate-400">Your Coins</div>
                <div className="text-3xl font-bold text-amber-300">💰 {user.coins || 0}</div>
              </div>
            )}
          </div>

          {/* Preview */}
          <Card className="bg-slate-900/70 border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Preview</p>
                <h2 className="text-xl font-bold text-amber-100">How your profile will look</h2>
              </div>
              {catalogLoading && <div className="text-sm text-slate-400">Loading catalog…</div>}
            </div>
            <div className="p-6 flex items-center gap-4">
              <div className={`avatar-frame-wrap w-16 h-16 ${equippedItems.frame ? "" : "border-2 border-white/20 bg-white/5"}`}>
                {equippedItems.badge === "badge_vip_halo" ? <div className="avatar-halo" /> : null}
                {equippedItems.frame ? (
                  <div className={`avatar-frame-ring ${frameRingClass(equippedItems.frame)} ${equippedItems.frame === "frame_animated" ? frameAnimClass(equippedItems.frameAnimation) : ""}`} />
                ) : null}
                <div className="avatar-frame-inner w-full h-full text-3xl">
                  {equippedAvatar?.icon || "🙂"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white truncate">
                  {displayName}{" "}
                  {equippedBadge?.icon ? <span className="ml-1">{equippedBadge.icon}</span> : null}
                  <span className="text-slate-400 text-sm font-normal">
                    {equippedNameEffect ? `(${equippedNameEffect.name})` : ""}
                  </span>
                </div>
                <div className="text-sm text-slate-300">
                  {equippedFrame ? `Frame: ${equippedFrame.name}` : "Frame: none"} • {equippedTheme ? `Theme: ${equippedTheme.name}` : "Theme: default"}
                </div>
                {equippedItems.frame === "frame_animated" ? (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">Animation:</span>
                    <select
                      className="bg-slate-950/60 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-200"
                      value={equippedItems.frameAnimation || "rotate"}
                      onChange={(e) =>
                        handleEquipCosmetic("frame_animated", "Animated Avatar Frame", { frameAnimation: e.target.value })
                      }
                      disabled={loading}
                    >
                      {FRAME_ANIMATIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          {!user && (
            <Card className="p-6 border-amber-400/40 bg-amber-500/10">
              <p className="text-amber-200">
                <strong>Sign in</strong> to buy and equip cosmetics.
              </p>
            </Card>
          )}

          {/* Catalog sections */}
          {CATEGORY_META.map((meta) => {
            const items = catalog.filter((i) => i.type === "cosmetic" && i.category === meta.category);
            if (items.length === 0) return null;

            return (
              <Card key={meta.category} className="bg-slate-900/70 border-white/10 shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                  {meta.icon}
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{meta.title}</p>
                    <h2 className="text-xl font-bold text-amber-100">{meta.subtitle}</h2>
                  </div>
                </div>
                <div className={`${meta.columns} p-6`}>
                  {items.map((item) => {
                    const owned = isOwned(item.id);
                    const equipped = meta.equipable ? isEquipped(item.id) : false;
                    const rarity = getRarity(item.price || 0);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border-2 ${equipped ? "border-emerald-400" : "border-white/10"} bg-gradient-to-br from-slate-900 to-slate-950 p-4 transition-all`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center text-2xl">
                            {item.icon || "✨"}
                          </div>
                          <div className="text-xs px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-200 shrink-0">
                            {rarity.label}
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-amber-100 mt-3">{item.name}</h3>
                        <p className="text-sm text-slate-300 mt-1">{item.description}</p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-amber-200 font-bold">{item.price} coins</div>
                          {owned && !meta.equipable && <div className="text-xs text-emerald-200">Collected</div>}
                        </div>

                        {meta.equipable && owned && equipped && (
                          <Button className="w-full mt-3 bg-emerald-600 text-white border-0" disabled>
                            <Check className="w-4 h-4 mr-2" /> Equipped
                          </Button>
                        )}

                        {meta.equipable && owned && !equipped && (
                          <Button
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleEquipCosmetic(item.id, item.name)}
                            disabled={loading}
                          >
                            Equip
                          </Button>
                        )}

                        {meta.category === "frame" && item.id === "frame_animated" && owned && equipped && (
                          <div className="mt-3">
                            <div className="text-xs text-slate-400 mb-1">Choose animation</div>
                            <select
                              className="w-full bg-slate-950/60 border border-white/10 rounded-md px-2 py-2 text-xs text-slate-200"
                              value={equippedItems.frameAnimation || "rotate"}
                              onChange={(e) => handleEquipCosmetic(item.id, item.name, { frameAnimation: e.target.value })}
                              disabled={loading}
                            >
                              {FRAME_ANIMATIONS.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {!owned && user && (
                          <Button
                            className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleBuyCosmeticWithCoins(item.id, item.name, item.price)}
                            disabled={loading}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" /> Buy
                          </Button>
                        )}

                        {!owned && !user && (
                          <Button className="w-full mt-3" variant="secondary" disabled>
                            Sign in
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {/* Info Card */}
          <Card className="bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-pink-500/20 border border-purple-400/40 shadow-[0_20px_40px_rgba(168,85,247,0.15)]">
            <div className="p-6 lg:p-8 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-purple-100">Your cosmetics appear in:</p>
                  <p className="text-slate-300 text-sm mt-1">✓ Your profile • ✓ Leaderboards • ✓ Friend notifications</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
