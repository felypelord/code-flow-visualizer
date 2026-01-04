import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/contexts/LanguageContext';

import { Camera, Save, Trophy, Zap, Target, Calendar, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SocialUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  isPro: boolean;
  level: number;
  xp: number;
  dailyStreak: number;
};

type FeaturedUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  isPro: boolean;
  level: number;
  xp: number;
  featuredUntil?: string | null;
};

type StoreItem = {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  price?: number;
  icon?: string;
  owned?: boolean;
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  xp: number;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string | null;
  progress?: number;
};

function displayName(u: Pick<SocialUser, 'firstName' | 'lastName'>) {
  const first = (u.firstName || '').trim();
  const last = (u.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  return full || 'User';
}

const AVATAR_GALLERY = [
  // Keep in sync with store avatar ids (stored in DB without the `avatar_` prefix)
  'default',
  'ninja',
  'robot',
  'wizard',
  'alien',
  'pirate',
  'astronaut',
  'cat',
  'fox',
  'octopus',
  'dragon_legend',
  // legacy/extra (safe fallbacks)
  'detective',
  'knight',
  'samurai',
  'viking',
  'phantom',
  'dragon',
  'phoenix',
  'tiger',
  'eagle',
];

const LEVEL_NAMES = [
  { min: 0, max: 100, name: 'Rookie', color: 'text-gray-400' },
  { min: 100, max: 500, name: 'Coder', color: 'text-green-400' },
  { min: 500, max: 1500, name: 'Developer', color: 'text-blue-400' },
  { min: 1500, max: 3000, name: 'Engineer', color: 'text-purple-400' },
  { min: 3000, max: 10000, name: 'Architect', color: 'text-amber-400' },
  { min: 10000, max: Infinity, name: 'Legend', color: 'text-red-400' },
];

function getLevelInfo(xp: number) {
  const level = LEVEL_NAMES.find(l => xp >= l.min && xp < l.max) || LEVEL_NAMES[LEVEL_NAMES.length - 1];
  const progress = level.max === Infinity ? 100 : ((xp - level.min) / (level.max - level.min)) * 100;
  return { ...level, progress };
}

export default function ProfilePage() {
  const { user, refreshUser } = useUser();
  const { t } = useLanguage();

  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ownedAvatars, setOwnedAvatars] = useState<Record<string, boolean>>({});
  const [ownedEmotes, setOwnedEmotes] = useState<StoreItem[]>([]);
  const [ownedPets, setOwnedPets] = useState<StoreItem[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<StoreItem[]>([]);
  const [hasTrophyCase, setHasTrophyCase] = useState(false);
  const [hasCustomThemeCreator, setHasCustomThemeCreator] = useState(false);
  const [hasCustomWatermark, setHasCustomWatermark] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [trophySlots, setTrophySlots] = useState<string[]>(['', '', '']);

  const [customGridColor, setCustomGridColor] = useState('#06b6d4');
  const [customGridOpacity, setCustomGridOpacity] = useState(0.1);
  const [themeCode, setThemeCode] = useState('');
  const [importThemeCode, setImportThemeCode] = useState('');

  const [socialLoading, setSocialLoading] = useState(false);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<SocialUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [incomingRequests, setIncomingRequests] = useState<Array<{ user: SocialUser; createdAt?: string }>>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Array<{ user: SocialUser; createdAt?: string }>>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);

  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredUsers, setFeaturedUsers] = useState<FeaturedUser[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    bio: '',
    avatar: 'default',
    usernameColor: '',
    watermarkText: '',
    theme: 'dark',
    language: 'en',
    dailyGoal: 3,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        country: user.country || '',
        bio: user.bio || '',
        avatar: user.avatar || 'default',
        usernameColor: user.usernameColor || '',
        watermarkText: user.watermarkText || '',
        theme: user.theme || 'dark',
        language: user.language || 'en',
        dailyGoal: user.dailyGoal || 3,
      });

      const initial = Array.isArray((user as any).trophyCase) ? (user as any).trophyCase as string[] : [];
      const slots = [initial[0] || '', initial[1] || '', initial[2] || ''];
      setTrophySlots(slots);

      const ct = (user as any).customTheme as any;
      if (ct && typeof ct === 'object' && typeof ct.gridColor === 'string') {
        setCustomGridColor(ct.gridColor);
        if (typeof ct.gridOpacity === 'number') setCustomGridOpacity(Math.max(0, Math.min(1, ct.gridOpacity)));
      }
    }
  }, [user]);

  useEffect(() => {
    try {
      const payload = { gridColor: customGridColor, gridOpacity: customGridOpacity };
      const raw = JSON.stringify(payload);
      setThemeCode(btoa(unescape(encodeURIComponent(raw))));
    } catch {
      setThemeCode('');
    }
  }, [customGridColor, customGridOpacity]);

  // Load owned avatars when opening the avatar picker so we can restrict selection
  useEffect(() => {
    if (!showAvatarPicker) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/store', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const data = await res.json();
        const owned: Record<string, boolean> = {};
        (data.items || []).forEach((it: any) => {
          if (it.category === 'avatar' && it.owned) {
            // server ids are like 'avatar_ninja' -> map to 'ninja'
            const name = String(it.id).replace(/^avatar_/, '');
            owned[name] = true;
          }
        });
        setOwnedAvatars(owned);
      } catch (e) {
        // ignore
      }
    })();
  }, [showAvatarPicker]);

  // Load owned collectibles for profile display (emotes/stickers + pets)
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/store', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({} as any));
        const items: StoreItem[] = Array.isArray(data.items) ? data.items : [];

        const emotes = items.filter((it) => it.owned && it.type === 'cosmetic' && it.category === 'emote');
        const pets = items.filter((it) => it.owned && it.type === 'cosmetic' && it.category === 'pet');
        const themes = items.filter((it) => it.owned && it.type === 'cosmetic' && it.category === 'theme');
        setOwnedEmotes(emotes);
        setOwnedPets(pets);
        setOwnedThemes(themes);
        setHasTrophyCase(items.some((it) => it.owned && it.id === 'trophy_case'));
        setHasCustomThemeCreator(items.some((it) => it.owned && it.id === 'custom_theme_creator'));
        setHasCustomWatermark(items.some((it) => it.owned && it.id === 'custom_watermark'));
      } catch (e) {
        // ignore
      }
    })();
  }, [user?.id]);

  async function saveCustomTheme() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('auth.signIn', 'Sign in'),
          description: t('profile.toast.signInToSaveTheme', 'Please sign in to save your custom theme.'),
        });
        return;
      }
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customTheme: { gridColor: customGridColor, gridOpacity: customGridOpacity },
          theme: 'theme_custom',
        }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(j?.message || 'Failed to save custom theme');
      if (refreshUser) await refreshUser();
      toast({ title: 'Custom theme saved', description: 'Your custom theme is now active.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Unable to save custom theme', variant: 'destructive' });
    }
  }

  function importThemeFromCode() {
    try {
      const raw = decodeURIComponent(escape(atob(importThemeCode.trim())));
      const parsed = JSON.parse(raw);
      const gridColor = String(parsed?.gridColor || '').trim();
      const gridOpacityNum = Number(parsed?.gridOpacity);
      if (!/^#[0-9a-fA-F]{6}$/.test(gridColor)) throw new Error('Invalid gridColor');
      if (!Number.isFinite(gridOpacityNum)) throw new Error('Invalid gridOpacity');
      setCustomGridColor(gridColor);
      setCustomGridOpacity(Math.max(0, Math.min(1, gridOpacityNum)));
      toast({ title: 'Imported', description: 'Theme code imported. Click Save to apply.' });
    } catch (e: any) {
      toast({ title: 'Invalid code', description: e?.message || 'Could not import theme code', variant: 'destructive' });
    }
  }

  useEffect(() => {
    if (!user || !hasTrophyCase) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/achievements', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({} as any));
        const all: Achievement[] = Array.isArray(data.achievements) ? data.achievements : [];
        setUnlockedAchievements(all.filter((a) => a.unlocked));
      } catch {
        // ignore
      }
    })();
  }, [user?.id, hasTrophyCase]);

  async function equipTheme(itemId: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('auth.signIn', 'Sign in'),
          description: t('profile.toast.signInToEquipThemes', 'Please sign in to equip themes.'),
        });
        return;
      }
      const res = await fetch('/api/cosmetics/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ itemId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Equip failed');
      toast({ title: 'Theme applied', description: j?.item ? `${j.item}` : 'Theme applied.' });
      if (refreshUser) await refreshUser();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Unable to equip theme', variant: 'destructive' });
    }
  }

  async function equipPet(itemId: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('auth.signIn', 'Sign in'),
          description: t('profile.toast.signInToEquipPets', 'Please sign in to equip pets.'),
        });
        return;
      }
      const res = await fetch('/api/cosmetics/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ itemId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Equip failed');
      toast({ title: 'Pet equipped', description: j?.item ? `${j.item}` : 'Pet equipped.' });
      if (refreshUser) await refreshUser();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Unable to equip pet', variant: 'destructive' });
    }
  }

  async function refreshSocial() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setSocialLoading(true);

      const [followingIdsRes, followersRes, followingUsersRes, requestsRes, friendsRes] = await Promise.all([
        fetch('/api/social/following', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/social/followers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/social/following/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/social/friend-requests', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/social/friends', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (followingIdsRes.ok) {
        const j = await followingIdsRes.json().catch(() => ({}));
        const ids = Array.isArray(j.following) ? j.following : [];
        setFollowingIds(new Set(ids));
      }
      if (followersRes.ok) {
        const j = await followersRes.json().catch(() => ({}));
        setFollowers(Array.isArray(j.followers) ? j.followers : []);
      }
      if (followingUsersRes.ok) {
        const j = await followingUsersRes.json().catch(() => ({}));
        setFollowingUsers(Array.isArray(j.following) ? j.following : []);
      }
      if (requestsRes.ok) {
        const j = await requestsRes.json().catch(() => ({}));
        setIncomingRequests(Array.isArray(j.incoming) ? j.incoming : []);
        setOutgoingRequests(Array.isArray(j.outgoing) ? j.outgoing : []);
      }
      if (friendsRes.ok) {
        const j = await friendsRes.json().catch(() => ({}));
        setFriends(Array.isArray(j.friends) ? j.friends : []);
      }
    } catch (e) {
      // ignore
    } finally {
      setSocialLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    refreshSocial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setFeaturedLoading(true);
        const res = await fetch('/api/featured-profiles?limit=10');
        if (!res.ok) return;
        const j = await res.json().catch(() => ({} as any));
        const rows = Array.isArray((j as any).featured) ? (j as any).featured : [];
        const next: FeaturedUser[] = rows.map((u: any) => ({
          id: String(u.id),
          firstName: u.firstName ?? null,
          lastName: u.lastName ?? null,
          avatar: u.avatar ?? null,
          isPro: Boolean(u.isPro),
          level: Number(u.level) || 1,
          xp: Number(u.xp) || 0,
          featuredUntil: u.featuredUntil ?? null,
        }));
        if (!cancelled) setFeaturedUsers(next);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function postJson(url: string, body: any) {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: t('auth.signIn', 'Sign in'),
        description: t('profile.toast.signInToUseSocial', 'Please sign in to use social features.'),
      });
      return { ok: false } as any;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body || {}),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || 'Request failed');
    return j;
  }

  async function follow(userId: string) {
    try {
      await postJson('/api/social/follow', { userId });
      toast({ title: 'Following', description: 'You are now following this user.' });
      await refreshSocial();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to follow', variant: 'destructive' });
    }
  }

  async function unfollow(userId: string) {
    try {
      await postJson('/api/social/unfollow', { userId });
      toast({ title: 'Unfollowed', description: 'You are no longer following this user.' });
      await refreshSocial();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to unfollow', variant: 'destructive' });
    }
  }

  async function sendFriendRequest(userId: string) {
    try {
      const j = await postJson('/api/social/friend-request/send', { userId });
      toast({ title: 'Friend request', description: j?.status === 'accepted' ? 'Friend request accepted.' : 'Friend request sent.' });
      await refreshSocial();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to send request', variant: 'destructive' });
    }
  }

  async function cancelFriendRequest(userId: string) {
    try {
      await postJson('/api/social/friend-request/cancel', { userId });
      toast({ title: 'Canceled', description: 'Friend request canceled.' });
      await refreshSocial();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to cancel request', variant: 'destructive' });
    }
  }

  async function acceptFriendRequest(userId: string) {
    try {
      await postJson('/api/social/friend-request/accept', { userId });
      toast({ title: 'Friends', description: 'Friend request accepted.' });
      await refreshSocial();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to accept request', variant: 'destructive' });
    }
  }

  async function declineFriendRequest(userId: string) {
    try {
      await postJson('/api/social/friend-request/decline', { userId });
      toast({ title: 'Declined', description: 'Friend request declined.' });
      await refreshSocial();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to decline request', variant: 'destructive' });
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-transparent">
        <div className="absolute inset-0 pointer-events-none opacity-55 bg-gradient-to-b from-white/5 via-transparent to-black/50" />
        <div className="relative z-10 text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(user.xp || 0);

  const featuredUntilDate = (() => {
    if (!user.featuredUntil) return null;
    const dt = new Date(user.featuredUntil);
    return Number.isFinite(dt.getTime()) ? dt : null;
  })();
  const isFeaturedActive = Boolean(featuredUntilDate && featuredUntilDate.getTime() > Date.now());

  const activePetId = (user.activePet || '').trim();
  const activePet = activePetId ? ownedPets.find((p) => p.id === activePetId) : undefined;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const normalizedSlots = trophySlots.map((s) => String(s || '').trim()).filter(Boolean);
      const uniqueSlots = Array.from(new Set(normalizedSlots)).slice(0, 3);
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          ...(hasTrophyCase ? { trophyCase: uniqueSlots } : {}),
          ...(hasCustomWatermark ? { watermarkText: String(formData.watermarkText || '') } : {}),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.message || 'Failed to update profile');
      }

      await refreshUser();
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden py-8 px-4 bg-transparent">
      <div className="absolute inset-0 pointer-events-none opacity-55 bg-gradient-to-b from-white/5 via-transparent to-black/50" />
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header with XP & Level */}
        <Card className="p-6 bg-gradient-to-r from-yellow-900/20 via-amber-900/20 to-yellow-900/20 border-yellow-600/40 shadow-[0_0_25px_rgba(251,191,36,0.2)]">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.equippedFrame ? (
                <div className="avatar-frame-wrap w-32 h-32">
                  {user.equippedBadge === 'badge_vip_halo' ? <div className="avatar-halo" /> : null}
                  <div
                    className={`avatar-frame-ring ${
                      user.equippedFrame === 'frame_gold'
                        ? 'avatar-frame--gold'
                        : user.equippedFrame === 'frame_silver'
                          ? 'avatar-frame--silver'
                          : user.equippedFrame === 'frame_rainbow'
                            ? 'avatar-frame--rainbow'
                            : user.equippedFrame === 'frame_neon'
                              ? 'avatar-frame--neon'
                              : user.equippedFrame === 'frame_onyx'
                                ? 'avatar-frame--onyx'
                                : user.equippedFrame === 'frame_animated'
                                  ? 'avatar-frame--animated'
                                  : ''
                    } ${
                      user.equippedFrame === 'frame_animated'
                        ? user.frameAnimation === 'pulse'
                          ? 'frame-anim-pulse'
                          : user.frameAnimation === 'shimmer'
                            ? 'frame-anim-shimmer'
                            : user.frameAnimation === 'glow'
                              ? 'frame-anim-glow'
                              : user.frameAnimation === 'wave'
                                ? 'frame-anim-wave'
                                : user.frameAnimation === 'bounce'
                                  ? 'frame-anim-bounce'
                                  : user.frameAnimation === 'wobble'
                                    ? 'frame-anim-wobble'
                                    : user.frameAnimation === 'tilt'
                                      ? 'frame-anim-tilt'
                                      : user.frameAnimation === 'zoom'
                                        ? 'frame-anim-zoom'
                                        : user.frameAnimation === 'flicker'
                                          ? 'frame-anim-flicker'
                                          : 'frame-anim-rotate'
                        : ''
                    }`}
                  />
                  <div className="avatar-frame-inner w-full h-full text-6xl">
                    {formData.avatar === 'default' ? '👤' : getAvatarEmoji(formData.avatar)}
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 p-1 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
                  {user.equippedBadge === 'badge_vip_halo' ? <div className="avatar-halo" /> : null}
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-6xl">
                    {formData.avatar === 'default' ? '👤' : getAvatarEmoji(formData.avatar)}
                  </div>
                </div>
              )}

              {activePetId ? (
                <div
                  className="absolute -bottom-2 -left-2 bg-slate-900/80 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1"
                  title={activePet?.name || 'Active pet'}
                >
                  <span className="text-base leading-none">{activePet?.icon || '🐾'}</span>
                </div>
              ) : null}
              {isEditing && (
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 rounded-full p-2 text-white shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1
                  className={
                    user.usernameColor
                      ? 'text-3xl font-bold cosmetic-name'
                      : 'text-3xl font-bold cosmetic-name bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent'
                  }
                  data-name-effect={user.equippedNameEffect || undefined}
                  style={user.usernameColor && !user.equippedNameEffect ? { color: user.usernameColor } : undefined}
                >
                  {user.firstName} {user.lastName}
                </h1>
                {user.equippedBadge ? (
                  <span className="text-2xl" title="Equipped badge">
                    {user.equippedBadge === 'badge_fire'
                      ? '🔥'
                      : user.equippedBadge === 'badge_diamond'
                        ? '💎'
                        : user.equippedBadge === 'badge_crown'
                          ? '👑'
                          : user.equippedBadge === 'badge_premium'
                            ? '🏅'
                            : user.equippedBadge === 'badge_vip_halo'
                              ? '✨'
                            : '🏷️'}
                  </span>
                ) : null}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${levelInfo.color} bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]`}>
                  {levelInfo.name}
                </span>
                {isFeaturedActive ? (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-semibold text-yellow-200 bg-slate-900/60 border border-yellow-600/40"
                    title={featuredUntilDate ? `Featured until ${featuredUntilDate.toLocaleString()}` : 'Featured'}
                  >
                    ⭐ Featured
                  </span>
                ) : null}
              </div>
              <p className="text-amber-200/70 text-sm mb-4">{user.email}</p>
              
              {/* XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-300 flex items-center gap-1 font-semibold">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    {user.xp || 0} XP
                  </span>
                  <span className="text-amber-300/70">
                    {levelInfo.max === Infinity ? 'MAX LEVEL' : `${levelInfo.max - (user.xp || 0)} XP to next`}
                  </span>
                </div>
                <div className="h-3 bg-slate-900/60 rounded-full overflow-hidden border border-yellow-600/30">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-600/30 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-yellow-200">{user.totalExercises || 0}</div>
                <div className="text-xs text-amber-300/70">Exercises</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-600/30 rounded-lg">
                <Target className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-orange-200">{user.dailyStreak || 0}</div>
                <div className="text-xs text-orange-300/70">Day Streak</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-600/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-blue-200">{formatTime(user.totalTime || 0)}</div>
                <div className="text-xs text-blue-300/70">Total Time</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-600/30 rounded-lg">
                <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-purple-200">{user.level || 1}</div>
                <div className="text-xs text-purple-300/70">Level</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Featured Profiles */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{t('profile.featured.title', 'Featured Profiles')}</h2>
            <a href="/leaderboard" className="text-blue-300 hover:text-blue-200 text-sm">
              {t('profile.featured.leaderboard', 'Leaderboard →')}
            </a>
          </div>

          {featuredLoading ? (
            <div className="text-sm text-gray-300">{t('profile.featured.loading', 'Loading...')}</div>
          ) : featuredUsers.length === 0 ? (
            <div className="text-sm text-gray-300">{t('profile.featured.empty', 'No featured profiles right now.')}</div>
          ) : (
            <div className="space-y-2">
              {featuredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{(u.avatar || 'default') === 'default' ? '👤' : getAvatarEmoji(u.avatar || 'default')}</div>
                    <div>
                      <div className="text-sm text-white">{displayName(u as any)} {u.isPro ? '👑' : ''}</div>
                      <div className="text-xs text-gray-400">Lvl {u.level} • {u.xp} XP</div>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/u/${u.id}`}>{t('profile.featured.view', 'View')}</a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Social */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Social</h2>
            <Button variant="outline" onClick={refreshSocial} disabled={socialLoading}>
              {socialLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">Followers</div>
                <div className="text-xs text-gray-400">{followers.length}</div>
              </div>
              {followers.length === 0 ? (
                <div className="text-sm text-gray-400">No followers yet.</div>
              ) : (
                <div className="space-y-2">
                  {followers.slice(0, 10).map((u) => {
                    const isFollowing = followingIds.has(u.id);
                    return (
                      <div key={u.id} className="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xl">{(u.avatar || 'default') === 'default' ? '👤' : getAvatarEmoji(u.avatar || 'default')}</div>
                          <div>
                            <div className="text-sm text-white">{displayName(u)} {u.isPro ? '👑' : ''}</div>
                            <div className="text-xs text-gray-400">Lvl {u.level} • {u.xp} XP</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <a href={`/u/${u.id}`}>View</a>
                          </Button>
                          {isFollowing ? (
                            <Button size="sm" variant="outline" onClick={() => unfollow(u.id)}>Unfollow</Button>
                          ) : (
                            <Button size="sm" onClick={() => follow(u.id)}>Follow back</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => sendFriendRequest(u.id)}>Add</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {followers.length > 10 && <div className="mt-2 text-xs text-gray-500">Showing 10 of {followers.length}</div>}
            </Card>

            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">Following</div>
                <div className="text-xs text-gray-400">{followingUsers.length}</div>
              </div>
              {followingUsers.length === 0 ? (
                <div className="text-sm text-gray-400">You are not following anyone yet.</div>
              ) : (
                <div className="space-y-2">
                  {followingUsers.slice(0, 10).map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{(u.avatar || 'default') === 'default' ? '👤' : getAvatarEmoji(u.avatar || 'default')}</div>
                        <div>
                          <div className="text-sm text-white">{displayName(u)} {u.isPro ? '👑' : ''}</div>
                          <div className="text-xs text-gray-400">Streak {u.dailyStreak} • Lvl {u.level}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`/u/${u.id}`}>View</a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => unfollow(u.id)}>Unfollow</Button>
                        <Button size="sm" variant="outline" onClick={() => sendFriendRequest(u.id)}>Add</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {followingUsers.length > 10 && <div className="mt-2 text-xs text-gray-500">Showing 10 of {followingUsers.length}</div>}
            </Card>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">Incoming requests</div>
                <div className="text-xs text-gray-400">{incomingRequests.length}</div>
              </div>
              {incomingRequests.length === 0 ? (
                <div className="text-sm text-gray-400">No pending requests.</div>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((r) => (
                    <div key={r.user.id} className="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{(r.user.avatar || 'default') === 'default' ? '👤' : getAvatarEmoji(r.user.avatar || 'default')}</div>
                        <div className="text-sm text-white">{displayName(r.user)} {r.user.isPro ? '👑' : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`/u/${r.user.id}`}>View</a>
                        </Button>
                        <Button size="sm" onClick={() => acceptFriendRequest(r.user.id)}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => declineFriendRequest(r.user.id)}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">Outgoing requests</div>
                <div className="text-xs text-gray-400">{outgoingRequests.length}</div>
              </div>
              {outgoingRequests.length === 0 ? (
                <div className="text-sm text-gray-400">No pending requests.</div>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((r) => (
                    <div key={r.user.id} className="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{(r.user.avatar || 'default') === 'default' ? '👤' : getAvatarEmoji(r.user.avatar || 'default')}</div>
                        <div className="text-sm text-white">{displayName(r.user)} {r.user.isPro ? '👑' : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`/u/${r.user.id}`}>View</a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancelFriendRequest(r.user.id)}>Cancel</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-4">
            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">Friends</div>
                <div className="text-xs text-gray-400">{friends.length}</div>
              </div>
              {friends.length === 0 ? (
                <div className="text-sm text-gray-400">No friends yet. Send some requests!</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {friends.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 bg-black/20 border border-white/10 rounded px-3 py-2">
                      <div className="text-xl">{(u.avatar || 'default') === 'default' ? '👤' : getAvatarEmoji(u.avatar || 'default')}</div>
                      <div className="text-sm text-white">{displayName(u)} {u.isPro ? '👑' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </Card>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Choose Avatar</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {AVATAR_GALLERY.map((avatar) => {
                const owned = !!ownedAvatars[avatar] || avatar === 'default';
                return (
                  <div key={avatar} className="relative">
                    <button
                      onClick={async () => {
                        if (!owned) {
                          // redirect to store for purchase
                          window.location.href = `/store`;
                          return;
                        }
                        // Owned: equip via store API to ensure server-side enforcement
                        try {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            toast({
                              title: t('auth.signIn', 'Sign in'),
                              description: t('profile.toast.signInToEquipAvatars', 'Please sign in to equip avatars.'),
                            });
                            return;
                          }
                          const res = await fetch('/api/cosmetics/equip', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            credentials: 'include',
                            body: JSON.stringify({ itemId: `avatar_${avatar}` }),
                          });
                          const j = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(j?.message || 'Equip failed');
                          toast({ title: 'Equipped', description: j?.message || 'Avatar equipped.' });
                          if (refreshUser) await refreshUser();
                          setShowAvatarPicker(false);
                        } catch (err: any) {
                          toast({ title: 'Error', description: err?.message || 'Unable to equip', variant: 'destructive' });
                        }
                      }}
                      className={`text-4xl p-3 rounded-lg transition-all flex items-center justify-center ${
                        formData.avatar === avatar ? 'bg-purple-600 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {getAvatarEmoji(avatar)}
                    </button>
                    {!owned && (
                      <div className="absolute inset-0 flex items-end justify-center p-2">
                        <div className="bg-black/60 text-xs text-gray-200 px-2 py-1 rounded-md">Buy in Store</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Profile Form */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline" disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email (read-only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-500 opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username Color (hex)</label>
              <input
                type="text"
                value={formData.usernameColor}
                onChange={(e) => setFormData({ ...formData, usernameColor: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                placeholder="#ff0000 (leave blank for default)"
              />
            </div>

            {hasCustomWatermark && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Export Watermark</label>
                <input
                  type="text"
                  value={formData.watermarkText}
                  onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                  placeholder="e.g. @YourName (max 48 chars)"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Daily Goal (exercises)</label>
              <select
                value={formData.dailyGoal}
                onChange={(e) => setFormData({ ...formData, dailyGoal: parseInt(e.target.value) })}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
              >
                {[1, 2, 3, 5, 10].map((goal) => (
                  <option key={goal} value={goal}>{goal} exercise{goal > 1 ? 's' : ''}/day</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-600/40 cursor-pointer hover:scale-105 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <a href="/history" className="block">
              <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-blue-200 mb-2">Activity History</h3>
              <p className="text-blue-300/80 text-sm">View your progress and stats</p>
            </a>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-600/40 cursor-pointer hover:scale-105 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <a href="/achievements" className="block">
              <Trophy className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-xl font-bold text-purple-200 mb-2">Achievements</h3>
              <p className="text-purple-300/80 text-sm">See your badges and milestones</p>
            </a>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-600/40 cursor-pointer hover:scale-105 transition-all shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            <a href="/pricing#store" className="block">
              <Zap className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="text-xl font-bold text-amber-200 mb-2">FlowCoins Store</h3>
              <p className="text-amber-300 text-sm mb-2 font-semibold">{user.coins || 0} FlowCoins</p>
              <p className="text-amber-300/70 text-xs">Spend on power-ups & cosmetics</p>
            </a>
          </Card>
        </div>

        {/* Trophy Case (paid): showcase achievements */}
        {hasTrophyCase && (
          <Card className="p-6 bg-slate-900/90 border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Trophy Case</h2>
                <div className="text-sm text-slate-300">Showcase up to 3 unlocked achievements</div>
              </div>
            </div>

            {isEditing ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[0, 1, 2].map((idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Slot {idx + 1}</label>
                    <select
                      value={trophySlots[idx] || ''}
                      onChange={(e) => {
                        const next = [...trophySlots];
                        next[idx] = e.target.value;
                        setTrophySlots(next);
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">(none)</option>
                      {unlockedAchievements.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.icon} {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {trophySlots.filter(Boolean).length === 0 ? (
                  <div className="md:col-span-3 text-sm text-slate-400">No featured achievements yet. Click Edit Profile to select them.</div>
                ) : (
                  trophySlots
                    .map((id) => id.trim())
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((id) => {
                      const a = unlockedAchievements.find((x) => x.id === id);
                      return (
                        <Card key={id} className="p-4 bg-slate-800/60 border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{a?.icon || '🏆'}</div>
                            <div className="min-w-0">
                              <div className="text-white font-semibold truncate">{a?.name || id}</div>
                              <div className="text-xs text-slate-400 truncate">{a?.description || ''}</div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                )}
              </div>
            )}
          </Card>
        )}

        {/* Custom Theme Creator (paid): create/save/share */}
        {hasCustomThemeCreator && (
          <Card className="p-6 bg-slate-900/90 border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Custom Theme Creator</h2>
                <div className="text-sm text-slate-300">Customize the background grid and share your theme code</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Grid color (hex)</label>
                <input
                  type="text"
                  value={customGridColor}
                  onChange={(e) => setCustomGridColor(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="#06b6d4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Grid opacity (0-1)</label>
                <input
                  type="number"
                  value={customGridOpacity}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(e) => setCustomGridOpacity(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={saveCustomTheme} className="w-full">Save & Apply</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Theme code (share)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={themeCode}
                    readOnly
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      try { navigator.clipboard.writeText(themeCode); toast({ title: 'Copied', description: 'Theme code copied.' }); } catch {}
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Import code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importThemeCode}
                    onChange={(e) => setImportThemeCode(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Paste a theme code"
                  />
                  <Button variant="outline" onClick={importThemeFromCode}>Import</Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Collectibles (MVP): Emotes + Pets */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Collectibles</h2>
              <div className="text-sm text-slate-300">Your owned emotes/stickers and pets</div>
            </div>
            <a href="/pricing#store" className="text-amber-200 hover:text-amber-100 text-sm">Open Store →</a>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="text-white font-semibold mb-2">Emotes & Stickers</div>
              {ownedEmotes.length === 0 ? (
                <div className="text-sm text-slate-400">No emotes yet. Buy a pack in the store.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ownedEmotes.map((it) => (
                    <div key={it.id} className="flex items-center gap-2 px-3 py-2 rounded bg-black/20 border border-white/10">
                      <div className="text-xl">{it.icon || '😄'}</div>
                      <div className="text-sm text-white">{it.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="text-white font-semibold mb-2">Pets</div>
              {ownedPets.length === 0 ? (
                <div className="text-sm text-slate-400">No pets yet. Adopt one in the store.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ownedPets.map((it) => {
                    const equipped = (user.activePet || '') === it.id;
                    return (
                      <div key={it.id} className="flex items-center gap-2 px-3 py-2 rounded bg-black/20 border border-white/10">
                        <div className="text-xl">{it.icon || '🐾'}</div>
                        <div className="text-sm text-white">{it.name}</div>
                        {equipped ? (
                          <div className="text-xs px-2 py-1 rounded bg-emerald-600 text-black">Equipped</div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => equipPet(it.id)}>
                            Equip
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-slate-800/60 border-white/5">
              <div className="text-white font-semibold mb-2">Themes</div>
              {ownedThemes.length === 0 ? (
                <div className="text-sm text-slate-400">No themes yet. Buy one in the store.</div>
              ) : (
                <div className="space-y-2">
                  {ownedThemes.map((it) => {
                    const equipped = (user?.theme || '') === it.id;
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-black/20 border border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-xl">{it.icon || '🎨'}</div>
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate">{it.name}</div>
                            <div className="text-xs text-slate-400 truncate">{it.description || ''}</div>
                          </div>
                        </div>
                        {equipped ? (
                          <div className="text-xs px-2 py-1 rounded bg-emerald-600 text-black">Equipped</div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => equipTheme(it.id)}>
                            Equip
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getAvatarEmoji(avatar: string): string {
  const emojiMap: Record<string, string> = {
    default: '👤',
    ninja: '🥷',
    robot: '🤖',
    wizard: '🧙',
    alien: '👽',
    pirate: '🏴‍☠️',
    astronaut: '👨‍🚀',
    cat: '🐱',
    fox: '🦊',
    octopus: '🐙',
    dragon_legend: '🐉',
    detective: '🕵️',
    knight: '🛡️',
    samurai: '⚔️',
    viking: '🪓',
    phantom: '👻',
    dragon: '🐉',
    phoenix: '🔥',
    tiger: '🐯',
    eagle: '🦅',
  };
  return emojiMap[avatar] || '👤';
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
