import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';

import { TrendingUp, Clock, Trophy, Target, Calendar, BarChart3, Zap } from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  title: string;
  xpEarned: number;
  timeSpent?: number;
  score?: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { user } = useUser();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    totalExercises: 0,
    avgScore: 0,
    avgTime: 0,
    totalXP: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view history</div>
      </div>
    );
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  // Generate heatmap data (last 90 days)
  const heatmapData = generateHeatmap(activities);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-400" />
            Activity History
          </h1>
          <a href="/profile" className="text-blue-400 hover:text-blue-300">
            ← Back to Profile
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-slate-900/80 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-gray-400">Exercises</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalExercises}</div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">Avg Score</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.avgScore}%</div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400">Avg Time</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatTime(stats.avgTime)}</div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-gray-400">Total XP</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalXP}</div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400">Streak</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.streak} days</div>
          </Card>
        </div>

        {/* Activity Heatmap */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-400" />
            Activity Heatmap (Last 90 Days)
          </h2>
          <div className="flex flex-wrap gap-1">
            {heatmapData.map((day, idx) => (
              <div
                key={idx}
                className="group relative"
                title={`${day.date}: ${day.count} activities`}
              >
                <div
                  className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)}`}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  {day.date}: {day.count} {day.count === 1 ? 'activity' : 'activities'}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-800 rounded-sm" />
              <div className="w-3 h-3 bg-green-900/50 rounded-sm" />
              <div className="w-3 h-3 bg-green-700/70 rounded-sm" />
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <div className="w-3 h-3 bg-green-400 rounded-sm" />
            </div>
            <span>More</span>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'exercise', 'lesson', 'profiler', 'inspector', 'debugger'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Activity List */}
        <Card className="p-6 bg-slate-900/90 border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activities</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No activities yet. Start coding to build your history!
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{activity.title}</span>
                      <span className="text-xs px-2 py-1 bg-slate-700 text-gray-300 rounded">
                        {activity.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {activity.timeSpent && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(activity.timeSpent)}
                        </span>
                      )}
                      {activity.score !== undefined && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {activity.score}%
                        </span>
                      )}
                      <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* XP Badge */}
                  <div className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm font-bold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    +{activity.xpEarned} XP
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  const icons = {
    exercise: <Trophy className="w-5 h-5" />,
    lesson: <Calendar className="w-5 h-5" />,
    profiler: <BarChart3 className="w-5 h-5" />,
    inspector: <Target className="w-5 h-5" />,
    debugger: <TrendingUp className="w-5 h-5" />,
  };
  return (icons as Record<string, any>)[type] || <Trophy className="w-5 h-5" />;
}

function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    exercise: 'bg-green-900/50 text-green-400',
    lesson: 'bg-blue-900/50 text-blue-400',
    profiler: 'bg-purple-900/50 text-purple-400',
    inspector: 'bg-amber-900/50 text-amber-400',
    debugger: 'bg-red-900/50 text-red-400',
  };
  return colors[type] || 'bg-slate-700 text-gray-400';
}

function formatTime(seconds: number): string {
  if (!seconds) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function generateHeatmap(activities: Activity[]) {
  const days = 90;
  const result = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const count = activities.filter(a => {
      const activityDate = new Date(a.createdAt).toISOString().split('T')[0];
      return activityDate === dateStr;
    }).length;
    
    result.push({ date: dateStr, count });
  }
  
  return result;
}

function getHeatmapColor(count: number): string {
  if (count === 0) return 'bg-slate-800';
  if (count <= 2) return 'bg-green-900/50';
  if (count <= 5) return 'bg-green-700/70';
  if (count <= 10) return 'bg-green-500';
  return 'bg-green-400';
}
