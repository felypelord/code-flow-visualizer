import Layout from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Rainbow, Flame, Shield, Crown, ShoppingCart, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";

const frames = [
  { id: "frame_gold", name: "Moldura Dourada", desc: "Brilho dourado com sombra suave", color: "from-yellow-500 to-amber-400", price: 600, icon: "🥇" },
  { id: "frame_silver", name: "Moldura Prateada", desc: "Borda elegante e sofisticada", color: "from-slate-400 to-slate-300", price: 400, icon: "🥈" },
  { id: "frame_rainbow", name: "Moldura Rainbow", desc: "Gradiente colorido animado", color: "from-pink-400 via-purple-400 to-blue-400", price: 800, icon: "🌈" },
  { id: "frame_emerald", name: "Moldura Esmeralda", desc: "Verde vibrante com brilho", color: "from-emerald-400 to-teal-400", price: 700, icon: "💚" },
];

const nameEffects = [
  { id: "name_effect_gold", name: "Nome Dourado", desc: "Texto dourado com brilho suave", color: "text-yellow-300", price: 400, icon: "✨" },
  { id: "name_effect_rainbow", name: "Nome Rainbow", desc: "Gradiente arco-íris animado", color: "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400", price: 600, icon: "🌈" },
  { id: "name_effect_flame", name: "Nome Flamejante", desc: "Efeito de chamas animadas", color: "text-orange-300", price: 800, icon: "🔥" },
];

const avatars = [
  { id: "avatar_ninja", name: "Avatar Ninja", desc: "Seja um ninja programador", color: "from-slate-700 to-slate-900", price: 300, icon: "🥷" },
  { id: "avatar_robot", name: "Avatar Robô", desc: "Transforme-se em robô", color: "from-cyan-500 to-blue-500", price: 350, icon: "🤖" },
  { id: "avatar_wizard", name: "Avatar Mago", desc: "Lance feitiços de código", color: "from-purple-600 to-indigo-600", price: 450, icon: "🧙" },
  { id: "avatar_alien", name: "Avatar Alienígena", desc: "Código do espaço exterior", color: "from-green-500 to-emerald-500", price: 500, icon: "👽" },
  { id: "avatar_pirate", name: "Avatar Pirata", desc: "Navegue os mares de código", color: "from-red-700 to-amber-700", price: 600, icon: "🏴‍☠️" },
  { id: "avatar_astronaut", name: "Avatar Astronauta", desc: "Programa em gravidade zero", color: "from-indigo-500 to-purple-500", price: 800, icon: "👨‍🚀" },
];

export default function CosmeticsPage() {
  const { user, refetch: refetchUser } = useUser();
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [equippedItems, setEquippedItems] = useState({
    avatar: "default",
    frame: null,
    nameEffect: null,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) loadInventory();
  }, [user]);

  const loadInventory = async () => {
    try {
      const res = await fetch("/api/cosmetics/inventory", {
        credentials: "include",
      });
      const data = await res.json();
      setInventory(data);
      setEquippedItems(data.equipped || {});
    } catch (err: any) {
      console.error("Error loading inventory:", err);
    }
  };

  const handleBuyCosmeticWithCoins = async (itemId: string, itemName: string, price: number) => {
    if (!user) {
      alert("Faça login para comprar cosméticos");
      return;
    }

    if ((user.coins || 0) < price) {
      alert(`Você precisa de ${price} coins. Você tem ${user.coins} coins.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cosmetics/buy-with-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ ${data.message}`);
        return;
      }

      setMessage(`✅ ${itemName} adquirido!`);
      await refetchUser();
      await loadInventory();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipCosmetic = async (itemId: string, itemName: string) => {
    if (!user) {
      alert("Faça login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cosmetics/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ ${data.message}`);
        return;
      }

      setMessage(`✅ ${itemName} equipado!`);
      setEquippedItems(data.equipped);
      await refetchUser();
      await loadInventory();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isOwned = (itemId: string) => inventory?.owned?.some((item: any) => item.id === itemId);
  const isEquipped = (itemId: string) => {
    if (itemId.startsWith("frame_")) return equippedItems.frame === itemId;
    if (itemId.startsWith("name_effect_")) return equippedItems.nameEffect === itemId;
    if (itemId.startsWith("avatar_")) return equippedItems.avatar === itemId.replace("avatar_", "");
    return false;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="container mx-auto px-4 py-12 space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cosméticos</p>
              <h1 className="text-4xl font-black text-amber-100 drop-shadow-[0_10px_40px_rgba(255,193,7,0.18)]">
                Personalize seu Perfil
              </h1>
              <p className="text-slate-200 mt-2 max-w-2xl">Compre e equipe frames, efeitos de nome e avatares com coins!</p>
            </div>
            {user && (
              <div className="text-right">
                <div className="text-sm text-slate-400">Seus Coins</div>
                <div className="text-3xl font-bold text-amber-300">💰 {user.coins || 0}</div>
              </div>
            )}
          </div>

          {message && (
            <Card className={`p-4 border-2 ${message.startsWith("✅") ? "border-emerald-400/40 bg-emerald-500/10" : "border-red-400/40 bg-red-500/10"}`}>
              <p className={message.startsWith("✅") ? "text-emerald-200" : "text-red-200"}>{message}</p>
            </Card>
          )}

          {!user && (
            <Card className="p-6 border-amber-400/40 bg-amber-500/10">
              <p className="text-amber-200">
                <strong>Faça login</strong> para comprar e equipar cosméticos!
              </p>
            </Card>
          )}

          {/* Avatars Section */}
          <Card className="bg-slate-900/70 border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Avatares</p>
                <h2 className="text-xl font-bold text-amber-100">Escolha sua identidade</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {avatars.map((a) => {
                const owned = isOwned(a.id);
                const equipped = isEquipped(a.id);
                return (
                  <div key={a.id} className={`rounded-xl border-2 ${equipped ? "border-emerald-400" : "border-white/10"} bg-gradient-to-br from-slate-900 to-slate-950 p-4 transition-all`}>
                    <div className={`w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-br ${a.color} border-2 border-white/20 flex items-center justify-center text-4xl shadow-lg`}>
                      {a.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-amber-100 text-center">{a.name}</h3>
                    <p className="text-sm text-slate-300 text-center mt-1">{a.desc}</p>
                    <div className="text-center text-amber-200 font-bold mt-3">{a.price} coins</div>
                    {owned && equipped && (
                      <Button className="w-full mt-3 bg-emerald-600 text-white border-0" disabled>
                        <Check className="w-4 h-4 mr-2" /> Equipado
                      </Button>
                    )}
                    {owned && !equipped && (
                      <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700" onClick={() => handleEquipCosmetic(a.id, a.name)} disabled={loading}>
                        Equipar
                      </Button>
                    )}
                    {!owned && user && (
                      <Button className="w-full mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => handleBuyCosmeticWithCoins(a.id, a.name, a.price)} disabled={loading}>
                        <ShoppingCart className="w-4 h-4 mr-2" /> Comprar
                      </Button>
                    )}
                    {!owned && !user && (
                      <Button className="w-full mt-3" variant="secondary" disabled>
                        Faça login
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Frames Section */}
          <Card className="bg-slate-900/70 border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Molduras</p>
                <h2 className="text-xl font-bold text-amber-100">Emoldure seu perfil</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {frames.map((f) => {
                const owned = isOwned(f.id);
                const equipped = isEquipped(f.id);
                return (
                  <div key={f.id} className={`rounded-xl border-2 ${equipped ? "border-emerald-400" : "border-white/10"} bg-gradient-to-br from-slate-900 to-slate-950 p-4 transition-all`}>
                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br ${f.color} border-2 border-white/20 shadow-lg`} />
                    <h3 className="text-lg font-semibold text-amber-100 text-center">{f.name}</h3>
                    <p className="text-sm text-slate-300 text-center mt-1">{f.desc}</p>
                    <div className="text-center text-amber-200 font-bold mt-3">{f.price} coins</div>
                    {owned && equipped && (
                      <Button className="w-full mt-3 bg-emerald-600 text-white border-0" disabled>
                        <Check className="w-4 h-4 mr-2" /> Equipado
                      </Button>
                    )}
                    {owned && !equipped && (
                      <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700" onClick={() => handleEquipCosmetic(f.id, f.name)} disabled={loading}>
                        Equipar
                      </Button>
                    )}
                    {!owned && user && (
                      <Button className="w-full mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => handleBuyCosmeticWithCoins(f.id, f.name, f.price)} disabled={loading}>
                        <ShoppingCart className="w-4 h-4 mr-2" /> Comprar
                      </Button>
                    )}
                    {!owned && !user && (
                      <Button className="w-full mt-3" variant="secondary" disabled>
                        Faça login
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Name Effects Section */}
          <Card className="bg-slate-900/70 border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Rainbow className="w-5 h-5 text-fuchsia-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Efeitos de Nome</p>
                <h2 className="text-xl font-bold text-amber-100">Faça seu nome brilhar</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {nameEffects.map((n) => {
                const owned = isOwned(n.id);
                const equipped = isEquipped(n.id);
                return (
                  <div key={n.id} className={`rounded-xl border-2 ${equipped ? "border-emerald-400" : "border-white/10"} bg-gradient-to-br from-slate-900 to-slate-950 p-4 transition-all`}>
                    <div className="text-center text-2xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
                      <span className={n.color.replace('text-transparent', '')}>{n.name}</span>
                    </div>
                    <p className="text-sm text-slate-300 text-center mt-2">{n.desc}</p>
                    <div className="text-center text-amber-200 font-bold mt-3">{n.price} coins</div>
                    {owned && equipped && (
                      <Button className="w-full mt-3 bg-emerald-600 text-white border-0" disabled>
                        <Check className="w-4 h-4 mr-2" /> Equipado
                      </Button>
                    )}
                    {owned && !equipped && (
                      <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700" onClick={() => handleEquipCosmetic(n.id, n.name)} disabled={loading}>
                        Equipar
                      </Button>
                    )}
                    {!owned && user && (
                      <Button className="w-full mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => handleBuyCosmeticWithCoins(n.id, n.name, n.price)} disabled={loading}>
                        <ShoppingCart className="w-4 h-4 mr-2" /> Comprar
                      </Button>
                    )}
                    {!owned && !user && (
                      <Button className="w-full mt-3" variant="secondary" disabled>
                        Faça login
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-pink-500/20 border border-purple-400/40 shadow-[0_20px_40px_rgba(168,85,247,0.15)]">
            <div className="p-6 lg:p-8 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-purple-100">Seus cosméticos aparecem em:</p>
                  <p className="text-slate-300 text-sm mt-1">✓ Seu perfil • ✓ Leaderboards • ✓ Notificações de amigos</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
