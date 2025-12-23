import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
import { Trophy, Lock, Zap, Target, Calendar, Flame, Brain, Star, Award, Medal } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'streak' | 'exercises' | 'speed' | 'accuracy' | 'learning' | 'special';
  requirement: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  total?: number;
}

const ACHIEVEMENTS_CATALOG: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // ...existing catalog items...
];

export default function AchievementsPage() {
  const { user } = useUser();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
      loadAchievements();
    }, []);

    const loadAchievements = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/achievements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAchievements(data.achievements || []);
        }
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="text-white text-xl">Please sign in to view achievements</div>
        </div>
      );
    }

    const filteredAchievements = filter === 'all'
      ? achievements
      : achievements.filter(a => a.category === filter);

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const completionPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-10 h-10 text-amber-400" />
              Achievements
            </h1>
            <a href="/profile" className="text-blue-400 hover:text-blue-300">
              ← Back to Profile
            </a>
          </div>

          {/* Progress Overview */}
          <Card className="p-6 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Progress</h2>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <p className="text-sm text-amber-200 mt-2">
                  {completionPercent.toFixed(1)}% Complete
                </p>
              </div>
              <div className="text-6xl">
                {completionPercent >= 100 ? '🏆' : completionPercent >= 75 ? '🥇' : completionPercent >= 50 ? '🥈' : completionPercent >= 25 ? '🥉' : '🎯'}
              </div>
            </div>
          </Card>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'streak', 'exercises', 'speed', 'accuracy', 'learning', 'special'].map((f) => (
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

          {/* Achievements Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center text-gray-400 py-8">Loading achievements...</div>
            ) : filteredAchievements.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-8">
                No achievements in this category yet
              </div>
            ) :
              filteredAchievements.map((achievement) => {
                return (
                <Card
                  key={achievement.id}
                  className={`p-6 transition-all ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-amber-500/50 hover:scale-105'
                      : 'bg-slate-900/50 border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`text-5xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.unlocked ? getAchievementIcon(achievement.icon) : <Lock className="w-12 h-12 text-gray-600" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                        {achievement.name}
                        {achievement.unlocked && (
                          <span className="text-xs px-2 py-1 bg-amber-600/30 text-amber-400 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            +{achievement.xpReward}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

                      {/* Progress Bar */}
                      {!achievement.unlocked && achievement.progress !== undefined && achievement.total !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.total}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Unlocked Date */}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-xs text-amber-400 mt-2">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
                );
                })}
            </div>
        </div>
      </div>
  );
}

function getAchievementIcon(icon: string) {
  const iconMap: Record<string, string> = {
    flame: '🔥',
    trophy: '🏆',
    zap: '⚡',
    target: '🎯',
    brain: '🧠',
    star: '⭐',
    award: '🏅',
    calendar: '📅',
    medal: '🥇',
  };
  return iconMap[icon] || '🏆';
}

