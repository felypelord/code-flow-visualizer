import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { ShoppingBag, Zap, Sparkles, Camera, Award, Palette, HelpCircle, Eye, Clock, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  type: 'cosmetic' | 'utility' | 'boost';
  price: number;
  icon: string;
  owned?: boolean;
  category: string;
}

const STORE_CATALOG: StoreItem[] = [
  // Cosmetics - Avatars
  { id: 'avatar_ninja', name: 'Ninja Avatar', description: 'Stealthy and cool 🥷', type: 'cosmetic', price: 50, icon: '🥷', category: 'avatar' },
  { id: 'avatar_robot', name: 'Robot Avatar', description: 'Beep boop 🤖', type: 'cosmetic', price: 50, icon: '🤖', category: 'avatar' },
  { id: 'avatar_wizard', name: 'Wizard Avatar', description: 'Magical powers ✨', type: 'cosmetic', price: 75, icon: '🧙', category: 'avatar' },
  { id: 'avatar_alien', name: 'Alien Avatar', description: 'Out of this world 👽', type: 'cosmetic', price: 75, icon: '👽', category: 'avatar' },
  { id: 'avatar_pirate', name: 'Pirate Avatar', description: 'Ahoy matey! 🏴‍☠️', type: 'cosmetic', price: 100, icon: '🏴‍☠️', category: 'avatar' },
  { id: 'avatar_astronaut', name: 'Astronaut Avatar', description: 'To infinity! 👨‍🚀', type: 'cosmetic', price: 150, icon: '👨‍🚀', category: 'avatar' },

  // Cosmetics - Badges
  { id: 'badge_fire', name: 'Fire Badge', description: 'Show you\'re on fire 🔥', type: 'cosmetic', price: 100, icon: '🔥', category: 'badge' },
  { id: 'badge_diamond', name: 'Diamond Badge', description: 'Shine bright 💎', type: 'cosmetic', price: 200, icon: '💎', category: 'badge' },
  { id: 'badge_crown', name: 'Crown Badge', description: 'Royalty status 👑', type: 'cosmetic', price: 300, icon: '👑', category: 'badge' },

  // Cosmetics - Themes
  { id: 'theme_neon', name: 'Neon Theme', description: 'Cyberpunk editor colors', type: 'cosmetic', price: 200, icon: '🌈', category: 'theme' },
  { id: 'theme_ocean', name: 'Ocean Theme', description: 'Deep blue vibes', type: 'cosmetic', price: 200, icon: '🌊', category: 'theme' },
  { id: 'theme_forest', name: 'Forest Theme', description: 'Natural green tones', type: 'cosmetic', price: 200, icon: '🌲', category: 'theme' },

  // Cosmetics - Profile Frames
  { id: 'frame_gold', name: 'Gold Frame', description: 'Legendary profile border', type: 'cosmetic', price: 150, icon: '🟡', category: 'frame' },
  { id: 'frame_silver', name: 'Silver Frame', description: 'Epic profile border', type: 'cosmetic', price: 100, icon: '⚪', category: 'frame' },
  { id: 'frame_rainbow', name: 'Rainbow Frame', description: 'Colorful profile border', type: 'cosmetic', price: 250, icon: '🌈', category: 'frame' },

  // Utilities
  { id: 'hint_token', name: 'Hint Token', description: 'Get 1 free hint in any exercise', type: 'utility', price: 10, icon: '💡', category: 'utility' },
  { id: 'hint_pack_5', name: 'Hint Pack (5x)', description: 'Get 5 free hints', type: 'utility', price: 40, icon: '💡', category: 'utility' },
  { id: 'solution_unlock', name: 'Solution Unlock', description: 'Instantly view 1 solution', type: 'utility', price: 25, icon: '🔓', category: 'utility' },
  { id: 'solution_pack_3', name: 'Solution Pack (3x)', description: 'Unlock 3 solutions', type: 'utility', price: 60, icon: '🔓', category: 'utility' },
  { id: 'skip_cooldown', name: 'Skip Cooldown', description: 'Remove cooldown once', type: 'utility', price: 30, icon: '⏩', category: 'utility' },

  // Boosts
  { id: 'xp_boost_2h', name: '2x XP Boost (2h)', description: 'Double XP for 2 hours', type: 'boost', price: 100, icon: '⚡', category: 'boost' },
  { id: 'xp_boost_24h', name: '2x XP Boost (24h)', description: 'Double XP for 24 hours', type: 'boost', price: 300, icon: '⚡', category: 'boost' },
  { id: 'streak_shield', name: 'Streak Shield', description: 'Protect your streak for 3 days', type: 'boost', price: 150, icon: '🛡️', category: 'boost' },
  
  // Weekly Challenge
  { id: 'boss_challenge', name: 'Boss Challenge (Weekly)', description: 'Unlock a special weekly challenge', type: 'utility', price: 200, icon: '🏆', category: 'challenge' },
];

export default function StorePage() {
  const { user, refreshUser } = useUser();
  // Translation removed, all text is now English
  const { toast } = useToast();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/store', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || STORE_CATALOG);
        setPurchases(data.purchases || []);
      } else {
        // Fallback to catalog
        setItems(STORE_CATALOG);
      }
    } catch (error) {
      console.error('Failed to load store:', error);
      setItems(STORE_CATALOG);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: StoreItem) => {
    if (!user) return;
    
    if ((user.coins || 0) < item.price) {
      toast({
        title: 'Not enough FlowCoins',
        description: `You need ${item.price} FlowCoins to purchase this item.`,
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Purchase ${item.name} for ${item.price} FlowCoins?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: item.id }),
      });

      if (!res.ok) throw new Error('Purchase failed');

      toast({
        title: 'Purchase successful!',
        description: `You bought ${item.name}`,
      });

      await refreshUser();
      loadStore();
    } catch (error) {
      toast({
        title: 'Purchase failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to access the store</div>
      </div>
    );
  }

  const filteredItems = filter === 'all'
    ? items
    : items.filter(i => i.type === filter || i.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="w-10 h-10 text-amber-400" />
              XP Store
            </h1>
            <p className="text-gray-400 mt-2">Spend your hard-earned XP on cool items!</p>
          </div>
          <a href="/profile" className="text-blue-400 hover:text-blue-300">
            ← Back to Profile
          </a>
        </div>

        {/* FlowCoins Balance */}
        <Card className="p-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center text-3xl">
                🪙
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  {user.coins || 0} FlowCoins
                </h2>
                <p className="text-amber-200 text-sm">Your current balance • Earn 1 coin per 50 XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-300">Level {user.level || 1}</p>
              <p className="text-xs text-amber-200/70">{user.xp || 0} XP</p>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'cosmetic', 'utility', 'boost', 'avatar', 'badge', 'theme', 'frame'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Store Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-gray-400 py-8">Loading store...</div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-8">
              No items in this category
            </div>
          ) : (
            filteredItems.map((item) => {
              const owned = purchases.includes(item.id);
              const canAfford = (user.coins || 0) >= item.price;

              return (
                <Card
                  key={item.id}
                  className={`p-6 transition-all ${
                    owned
                      ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-600/50'
                      : canAfford
                        ? 'bg-slate-900 border-slate-700 hover:border-amber-500 hover:scale-105'
                        : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon */}
                    <div className={`text-5xl ${owned ? '' : !canAfford ? 'grayscale opacity-50' : ''}`}>
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white">{item.name}</h3>
                        {owned && (
                          <span className="text-xs px-2 py-1 bg-green-600/30 text-green-400 rounded-full">
                            Owned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{item.description}</p>

                      {/* Type Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.type === 'cosmetic' ? 'bg-purple-600/30 text-purple-400' :
                        item.type === 'utility' ? 'bg-blue-600/30 text-blue-400' :
                        'bg-amber-600/30 text-amber-400'
                      }`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Zap className="w-5 h-5" />
                      {item.price} FlowCoins
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={owned || !canAfford}
                      className={`${
                        owned
                          ? 'bg-green-700 cursor-not-allowed'
                          : !canAfford
                            ? 'bg-slate-700 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {owned ? 'Owned' : !canAfford ? 'Not enough coins' : 'Buy'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* How to Earn FlowCoins */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-400" />
            How to Earn FlowCoins
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-semibold text-white mb-1">Complete Exercises</h3>
              <p className="text-sm text-gray-400">Earn 1 FlowCoin per 50 XP (10-50 XP per exercise)</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="font-semibold text-white mb-1">Daily Streak</h3>
              <p className="text-sm text-gray-400">Bonus XP for streaks = more FlowCoins</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-semibold text-white mb-1">Unlock Achievements</h3>
              <p className="text-sm text-gray-400">Each achievement gives 25-500 XP</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
