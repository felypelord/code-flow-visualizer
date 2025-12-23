import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';

import { Camera, Save, Trophy, Zap, Target, Calendar, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AVATAR_GALLERY = [
  'default', 'ninja', 'robot', 'wizard', 'alien', 'pirate', 'astronaut', 'detective',
  'knight', 'samurai', 'viking', 'phantom', 'dragon', 'phoenix', 'tiger', 'eagle'
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

  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    bio: '',
    avatar: 'default',
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
        theme: user.theme || 'dark',
        language: user.language || 'en',
        dailyGoal: user.dailyGoal || 3,
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(user.xp || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      await refreshUser();
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
      setIsEditing(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with XP & Level */}
        <Card className="p-6 bg-gradient-to-r from-yellow-900/20 via-amber-900/20 to-yellow-900/20 border-yellow-600/40 shadow-[0_0_25px_rgba(251,191,36,0.2)]">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 p-1 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-6xl">
                  {formData.avatar === 'default' ? '👤' : getAvatarEmoji(formData.avatar)}
                </div>
              </div>
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  {user.firstName} {user.lastName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${levelInfo.color} bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]`}>
                  {levelInfo.name}
                </span>
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

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Choose Avatar</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {AVATAR_GALLERY.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => {
                    setFormData({ ...formData, avatar });
                    setShowAvatarPicker(false);
                  }}
                  className={`text-4xl p-3 rounded-lg transition-all ${
                    formData.avatar === avatar
                      ? 'bg-purple-600 scale-110'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {getAvatarEmoji(avatar)}
                </button>
              ))}
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
            <a href="/store" className="block">
              <Zap className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="text-xl font-bold text-amber-200 mb-2">FlowCoins Store</h3>
              <p className="text-amber-300 text-sm mb-2 font-semibold">{user.coins || 0} FlowCoins</p>
              <p className="text-amber-300/70 text-xs">Spend on power-ups & cosmetics</p>
            </a>
          </Card>
        </div>
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
