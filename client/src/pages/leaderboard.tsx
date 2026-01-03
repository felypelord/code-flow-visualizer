import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
import { Trophy, Flame, Zap, Crown, Medal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaderboardEntry {
  id: string;
  firstName?: string;
  lastName?: string;
  usernameColor?: string | null;
  equippedBadge?: string | null;
  equippedFrame?: string | null;
  frameAnimation?: string | null;
  xp?: number;
  dailyStreak?: number;
  level?: number;
  avatar?: string;
  isPro?: boolean;
}

type MeRank = {
  mode: 'xp' | 'streak';
  rank: number;
  total: number;
  youValue: number;
  next: (LeaderboardEntry & { value?: number }) | null;
};

export default function LeaderboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'xp' | 'streak'>('xp');
  const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [featuredProfiles, setFeaturedProfiles] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [meRank, setMeRank] = useState<MeRank | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<string[]>([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<string[]>([]);

  useEffect(() => {
    loadLeaderboards();
    loadFeatured();
  }, []);

  useEffect(() => {
    if (!user) {
      setMeRank(null);
      setFollowing([]);
      setFriends([]);
      setIncomingFriendRequests([]);
      setOutgoingFriendRequests([]);
      return;
    }
    loadMeRank();
    loadFollowing();
    loadFriendState();
  }, [user, tab]);

  const loadFriendState = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFriends([]);
        setIncomingFriendRequests([]);
        setOutgoingFriendRequests([]);
        return;
      }

      const [friendsRes, reqRes] = await Promise.all([
        fetch('/api/social/friends', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }),
        fetch('/api/social/friend-requests', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }),
      ]);

      if (friendsRes.ok) {
        const j = await friendsRes.json().catch(() => ({}));
        const ids = Array.isArray(j?.friends) ? j.friends.map((u: any) => u?.id).filter(Boolean) : [];
        setFriends(ids);
      } else {
        setFriends([]);
      }

      if (reqRes.ok) {
        const j = await reqRes.json().catch(() => ({}));
        const incomingIds = Array.isArray(j?.incoming) ? j.incoming.map((r: any) => r?.user?.id).filter(Boolean) : [];
        const outgoingIds = Array.isArray(j?.outgoing) ? j.outgoing.map((r: any) => r?.user?.id).filter(Boolean) : [];
        setIncomingFriendRequests(incomingIds);
        setOutgoingFriendRequests(outgoingIds);
      } else {
        setIncomingFriendRequests([]);
        setOutgoingFriendRequests([]);
      }
    } catch (e) {
      console.error('Failed to load friend state:', e);
      setFriends([]);
      setIncomingFriendRequests([]);
      setOutgoingFriendRequests([]);
    }
  };

  const postAuthed = async (url: string, body: any) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error(t('auth.sessionExpired.desc', 'Please sign in again.'));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify(body || {}),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || 'Request failed');
    return j;
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      if (!user) {
        toast({
          title: t('leaderboard.toast.loginRequired.title', 'Login required'),
          description: t('leaderboard.toast.loginRequired.addFriends', 'Sign in to add friends.'),
          variant: 'destructive',
        });
        return;
      }
      await postAuthed('/api/social/friend-request/send', { userId: targetUserId });
      toast({ title: 'Friend request', description: 'Request sent.' });
      await loadFriendState();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to send request.', variant: 'destructive' });
    }
  };

  const acceptFriendRequest = async (fromUserId: string) => {
    try {
      if (!user) {
        toast({
          title: t('leaderboard.toast.loginRequired.title', 'Login required'),
          description: t('leaderboard.toast.loginRequired.acceptRequests', 'Sign in to accept requests.'),
          variant: 'destructive',
        });
        return;
      }
      await postAuthed('/api/social/friend-request/accept', { userId: fromUserId });
      toast({ title: 'Friends', description: 'Request accepted.' });
      await loadFriendState();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to accept request.', variant: 'destructive' });
    }
  };

  const loadLeaderboards = async () => {
    try {
      const [xpRes, streakRes] = await Promise.all([
        fetch('/api/leaderboard/xp?limit=50'),
        fetch('/api/leaderboard/streak?limit=50'),
      ]);

      if (xpRes.ok) {
        const xpData = await xpRes.json();
        setXpLeaderboard(xpData.leaderboard || []);
      }

      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setStreakLeaderboard(streakData.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatured = async () => {
    try {
      const res = await fetch('/api/featured-profiles?limit=8');
      if (!res.ok) {
        setFeaturedProfiles([]);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      setFeaturedProfiles(Array.isArray(data?.featured) ? data.featured : []);
    } catch (e) {
      console.error('Failed to load featured profiles:', e);
      setFeaturedProfiles([]);
    }
  };

  const loadMeRank = async () => {
    try {
      setMeLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMeRank(null);
        return;
      }

      const res = await fetch(`/api/leaderboard/me?mode=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!res.ok) {
        setMeRank(null);
        return;
      }

      const data = (await res.json()) as MeRank;
      setMeRank(data);
    } catch (e) {
      console.error('Failed to load user rank:', e);
      setMeRank(null);
    } finally {
      setMeLoading(false);
    }
  };

  const loadFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFollowing([]);
        return;
      }

      const res = await fetch('/api/social/following', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!res.ok) {
        setFollowing([]);
        return;
      }

      const data = await res.json();
      setFollowing(Array.isArray(data?.following) ? data.following : []);
    } catch (e) {
      console.error('Failed to load following:', e);
      setFollowing([]);
    }
  };

  const setIsFollowing = (userId: string, isFollowing: boolean) => {
    setFollowing((prev) => {
      const exists = prev.includes(userId);
      if (isFollowing) return exists ? prev : [...prev, userId];
      return exists ? prev.filter((id) => id !== userId) : prev;
    });
  };

  const toggleFollow = async (targetUserId: string) => {
    try {
      if (!user) {
        toast({
          title: t('leaderboard.toast.loginRequired.title', 'Login required'),
          description: t('leaderboard.toast.loginRequired.followUsers', 'Sign in to follow users.'),
          variant: 'destructive',
        });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('auth.sessionExpired.title', 'Session expired'),
          description: t('auth.sessionExpired.desc', 'Please sign in again.'),
          variant: 'destructive',
        });
        return;
      }

      const currentlyFollowing = following.includes(targetUserId);
      setIsFollowing(targetUserId, !currentlyFollowing);

      const res = await fetch(currentlyFollowing ? '/api/social/unfollow' : '/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ userId: targetUserId }),
      });

      if (!res.ok) {
        // revert
        setIsFollowing(targetUserId, currentlyFollowing);
        const text = await res.text().catch(() => '');
        toast({ title: 'Action failed', description: text || 'Could not update follow state.', variant: 'destructive' });
        return;
      }

      toast({ title: currentlyFollowing ? 'Unfollowed' : 'Following', description: currentlyFollowing ? 'You stopped following this user.' : 'You are now following this user.' });
    } catch (e: any) {
      console.error('Follow toggle failed:', e);
      toast({ title: 'Error', description: e?.message || 'Unexpected error.', variant: 'destructive' });
    }
  };

  const getAvatarEmoji = (avatar?: string) => {
    const map: Record<string, string> = {
      default: '👤',
      ninja: '🥷',
      robot: '🤖',
      wizard: '🧙',
      alien: '👽',
      pirate: '🏴‍☠️',
      astronaut: '👨‍🚀',
    };
    return map[avatar || 'default'] || '👤';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-xl font-bold text-gray-500">#{rank}</span>;
  };

  const currentLeaderboard = tab === 'xp' ? xpLeaderboard : streakLeaderboard;

  const formatName = (entry?: Pick<LeaderboardEntry, 'firstName' | 'lastName'> | null) => {
    const first = entry?.firstName || 'User';
    const last = entry?.lastName || '';
    return `${first} ${last}`.trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Trophy className="w-12 h-12 text-yellow-400" />
            Leaderboard
          </h1>
          <p className="text-blue-300 text-lg">
            Compete with the best coders worldwide
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setTab('xp')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
              tab === 'xp'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-5 h-5" />
            Top XP
          </button>
          <button
            onClick={() => setTab('streak')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
              tab === 'streak'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-105'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-5 h-5" />
            Top Streak
          </button>
        </div>

        {/* Featured Profiles */}
        {featuredProfiles.length > 0 && (
          <Card className="p-4 bg-slate-900/80 border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-bold">Featured Profiles</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredProfiles.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 rounded-lg p-3">
                  <div className="avatar-frame-wrap w-10 h-10">
                    {entry.equippedBadge === 'badge_vip_halo' ? <div className="avatar-halo" /> : null}
                    {entry.equippedFrame ? (
                      <div
                        className={`avatar-frame-ring ${
                          entry.equippedFrame === 'frame_gold'
                            ? 'avatar-frame--gold'
                            : entry.equippedFrame === 'frame_silver'
                              ? 'avatar-frame--silver'
                              : entry.equippedFrame === 'frame_rainbow'
                                ? 'avatar-frame--rainbow'
                                : entry.equippedFrame === 'frame_neon'
                                  ? 'avatar-frame--neon'
                                  : entry.equippedFrame === 'frame_onyx'
                                    ? 'avatar-frame--onyx'
                                    : entry.equippedFrame === 'frame_animated'
                                      ? 'avatar-frame--animated'
                                      : ''
                        } ${
                          entry.equippedFrame === 'frame_animated'
                            ? entry.frameAnimation === 'pulse'
                              ? 'frame-anim-pulse'
                              : entry.frameAnimation === 'shimmer'
                                ? 'frame-anim-shimmer'
                                : entry.frameAnimation === 'glow'
                                  ? 'frame-anim-glow'
                                  : entry.frameAnimation === 'wave'
                                    ? 'frame-anim-wave'
                                    : entry.frameAnimation === 'bounce'
                                      ? 'frame-anim-bounce'
                                      : entry.frameAnimation === 'wobble'
                                        ? 'frame-anim-wobble'
                                        : entry.frameAnimation === 'tilt'
                                          ? 'frame-anim-tilt'
                                          : entry.frameAnimation === 'zoom'
                                            ? 'frame-anim-zoom'
                                            : entry.frameAnimation === 'flicker'
                                              ? 'frame-anim-flicker'
                                              : 'frame-anim-rotate'
                            : ''
                        }`}
                      />
                    ) : null}
                    <div className="avatar-frame-inner w-full h-full text-2xl">{getAvatarEmoji(entry.avatar)}</div>
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-semibold truncate ${entry.usernameColor ? '' : 'text-white'}`}
                      style={entry.usernameColor ? { color: entry.usernameColor } : undefined}
                      title={formatName(entry)}
                    >
                      {formatName(entry)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.xp || 0} XP • L{entry.level || 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* User's rank card */}
        {user && (
          <Card className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="avatar-frame-wrap w-10 h-10">
                  {user.equippedBadge === 'badge_vip_halo' ? <div className="avatar-halo" /> : null}
                  {user.equippedFrame ? (
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
                  ) : null}
                  <div className="avatar-frame-inner w-full h-full text-2xl">{getAvatarEmoji(user.avatar || 'default')}</div>
                </div>
                <div>
                  <p className="text-white font-bold">
                    Your Rank:{' '}
                    {meLoading ? 'Loading…' : meRank ? `#${meRank.rank}${meRank.total ? ` / ${meRank.total}` : ''}` : '—'}
                  </p>
                  <p className="text-blue-300 text-sm">
                    {tab === 'xp' ? `${user.xp || 0} XP` : `${user.dailyStreak || 0} day streak`}
                  </p>
                  {meRank && (
                    <p className="text-gray-300 text-xs mt-1">
                      {meRank.next ? (
                        tab === 'xp' ? (
                          <>
                            Need <span className="text-yellow-300 font-semibold">{Math.max(0, (meRank.next as any).value - meRank.youValue)}</span> XP to pass{' '}
                            <span className="text-gray-200">{formatName(meRank.next)}</span>
                          </>
                        ) : (
                          <>
                            Need <span className="text-orange-300 font-semibold">{Math.max(0, (meRank.next as any).value - meRank.youValue)}</span> days to pass{' '}
                            <span className="text-gray-200">{formatName(meRank.next)}</span>
                          </>
                        )
                      ) : (
                        <>You're currently #1 🎉</>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {user.isPro && (
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-bold rounded-full">
                  PRO
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading leaderboard...</div>
          ) : currentLeaderboard.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No data yet</div>
          ) : (
            currentLeaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const isCurrentUser = user && entry.id === user.id;
              const isFollowing = user ? following.includes(entry.id) : false;
              const isFriend = user ? friends.includes(entry.id) : false;
              const hasIncomingRequest = user ? incomingFriendRequests.includes(entry.id) : false;
              const hasOutgoingRequest = user ? outgoingFriendRequests.includes(entry.id) : false;

              return (
                <Card
                  key={entry.id}
                  className={`p-4 transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-blue-500 scale-105'
                      : rank <= 3
                        ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-700/50'
                        : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-12 flex justify-center">{getRankIcon(rank)}</div>

                      {/* Avatar */}
                      <div className="avatar-frame-wrap w-11 h-11">
                        {entry.equippedBadge === 'badge_vip_halo' ? <div className="avatar-halo" /> : null}
                        {entry.equippedFrame ? (
                          <div
                            className={`avatar-frame-ring ${
                              entry.equippedFrame === 'frame_gold'
                                ? 'avatar-frame--gold'
                                : entry.equippedFrame === 'frame_silver'
                                  ? 'avatar-frame--silver'
                                  : entry.equippedFrame === 'frame_rainbow'
                                    ? 'avatar-frame--rainbow'
                                    : entry.equippedFrame === 'frame_neon'
                                      ? 'avatar-frame--neon'
                                      : entry.equippedFrame === 'frame_onyx'
                                        ? 'avatar-frame--onyx'
                                        : entry.equippedFrame === 'frame_animated'
                                          ? 'avatar-frame--animated'
                                          : ''
                            } ${
                              entry.equippedFrame === 'frame_animated'
                                ? entry.frameAnimation === 'pulse'
                                  ? 'frame-anim-pulse'
                                  : entry.frameAnimation === 'shimmer'
                                    ? 'frame-anim-shimmer'
                                    : entry.frameAnimation === 'glow'
                                      ? 'frame-anim-glow'
                                      : entry.frameAnimation === 'wave'
                                        ? 'frame-anim-wave'
                                        : entry.frameAnimation === 'bounce'
                                          ? 'frame-anim-bounce'
                                          : entry.frameAnimation === 'wobble'
                                            ? 'frame-anim-wobble'
                                            : entry.frameAnimation === 'tilt'
                                              ? 'frame-anim-tilt'
                                              : entry.frameAnimation === 'zoom'
                                                ? 'frame-anim-zoom'
                                                : entry.frameAnimation === 'flicker'
                                                  ? 'frame-anim-flicker'
                                                  : 'frame-anim-rotate'
                                : ''
                            }`}
                          />
                        ) : null}
                        <div className="avatar-frame-inner w-full h-full text-2xl">{getAvatarEmoji(entry.avatar)}</div>
                      </div>

                      {/* Info */}
                      <div>
                        <p
                          className={`font-bold flex items-center gap-2 ${entry.usernameColor ? '' : 'text-white'}`}
                          style={entry.usernameColor ? { color: entry.usernameColor } : undefined}
                        >
                          {entry.firstName || 'User'} {entry.lastName || ''}
                          {entry.equippedBadge ? (
                            <span className="text-lg" title="Badge">
                              {entry.equippedBadge === 'badge_fire'
                                ? '🔥'
                                : entry.equippedBadge === 'badge_diamond'
                                  ? '💎'
                                  : entry.equippedBadge === 'badge_crown'
                                    ? '👑'
                                    : entry.equippedBadge === 'badge_premium'
                                      ? '🏅'
                                      : '🏷️'}
                            </span>
                          ) : null}
                          {entry.isPro && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-bold rounded-full">
                              PRO
                            </span>
                          )}
                        </p>
                        <p className="text-gray-400 text-sm">Level {entry.level || 1}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex items-center gap-3">
                      {!isCurrentUser && (
                        <div className="flex items-center gap-2">
                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                              isFollowing
                                ? 'bg-slate-800 border-slate-600 text-gray-200 hover:bg-slate-700'
                                : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                            }`}
                            onClick={() => toggleFollow(entry.id)}
                            disabled={!user}
                            title={!user ? 'Sign in to follow users' : isFollowing ? 'Unfollow' : 'Follow'}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>

                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                              isFriend
                                ? 'bg-slate-800 border-slate-600 text-gray-200'
                                : hasIncomingRequest
                                  ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                                  : hasOutgoingRequest
                                    ? 'bg-slate-800 border-slate-700 text-gray-300'
                                    : 'bg-purple-600 border-purple-500 text-white hover:bg-purple-500'
                            }`}
                            onClick={() => {
                              if (isFriend || hasOutgoingRequest) return;
                              if (hasIncomingRequest) return acceptFriendRequest(entry.id);
                              return sendFriendRequest(entry.id);
                            }}
                            disabled={!user || isFriend || hasOutgoingRequest}
                            title={!user ? 'Sign in to add friends' : isFriend ? 'Already friends' : hasOutgoingRequest ? 'Request already sent' : hasIncomingRequest ? 'Accept friend request' : 'Send friend request'}
                          >
                            {isFriend ? 'Friends' : hasIncomingRequest ? 'Accept' : hasOutgoingRequest ? 'Requested' : 'Add'}
                          </button>
                        </div>
                      )}
                      {tab === 'xp' ? (
                        <div>
                          <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            {entry.xp || 0}
                          </p>
                          <p className="text-gray-500 text-xs">XP</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                            <Flame className="w-5 h-5" />
                            {entry.dailyStreak || 0}
                          </p>
                          <p className="text-gray-500 text-xs">days</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
