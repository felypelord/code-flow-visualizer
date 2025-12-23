import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, TrendingUp, Clock, Award } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

interface AdStats {
  adsWatched: number;
  usageGained: number;
  canWatchNow: boolean;
  canWatchIn: number; // seconds
  lastAdWatched: string | null;
  freeUsageCount: number;
}

interface AdStatsWidgetProps {
  onWatchAd: () => void;
  isWatching: boolean;
}

export function AdStatsWidget({ onWatchAd, isWatching }: AdStatsWidgetProps) {
  const { user } = useUser();
  const [stats, setStats] = useState<AdStats | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!user || user.isPro) return;

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!stats || stats.canWatchNow) return;

    setCountdown(stats.canWatchIn);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchStats(); // Refresh when cooldown ends
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stats]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics/ad-stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch ad stats:', error);
    }
  };

  if (!user || user.isPro || !stats) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Usage */}
        <Card className="p-4 bg-slate-800/50 border-purple-500/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
              <div>
                <p className="text-sm text-gray-400">Available Uses</p>
                <p className="text-2xl font-bold text-purple-400">
                {stats.freeUsageCount}
                </p>
              </div>
          </div>
        </Card>

        {/* Total Ads Watched */}
        <Card className="p-4 bg-slate-800/50 border-green-500/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <PlayCircle className="w-6 h-6 text-green-400" />
            </div>
              <div>
                <p className="text-sm text-gray-400">Ads Watched</p>
                <p className="text-2xl font-bold text-green-400">
                {stats.adsWatched}
                </p>
              </div>
          </div>
        </Card>

        {/* Total Usage Gained */}
        <Card className="p-4 bg-slate-800/50 border-yellow-500/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
              <div>
                <p className="text-sm text-gray-400">Uses Gained</p>
                <p className="text-2xl font-bold text-yellow-400">
                +{stats.usageGained}
                </p>
              </div>
          </div>
        </Card>

        {/* Watch Ad Button */}
        <Card className="p-4 bg-slate-800/50 border-blue-500/30 backdrop-blur">
          <div className="flex items-center gap-3">
              {stats.canWatchNow ? (
              <Button
                onClick={onWatchAd}
                disabled={isWatching}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Watch Now
                <br />
                <span className="text-xs">+5 Uses</span>
              </Button>
            ) : (
              <div className="w-full text-center">
                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-1">Next ad in</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatTime(countdown)}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="mt-4 p-4 bg-slate-800/50 border-purple-500/30 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Daily goal: 5 ads
          </span>
          <span className="text-sm font-semibold text-purple-400">
            {Math.min(stats.adsWatched % 5, 5)}/5
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((stats.adsWatched % 5) * 20, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          🎉 Complete 5 ads per day to earn +5 bonus uses!
        </p>
      </Card>
    </div>
  );
}
