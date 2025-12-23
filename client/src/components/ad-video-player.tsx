import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, X, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdVideoPlayerProps {
  onAdComplete: () => void;
  onClose: () => void;
}

export function AdVideoPlayer({ onAdComplete, onClose }: AdVideoPlayerProps) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(false);
  const [adType, setAdType] = useState<'video' | 'display'>('video');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize Google AdSense or ad provider
    const initAd = async () => {
      // Check if AdSense is available
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          // Push AdSense ad
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
          // Fallback to simulated ad if AdSense fails
          startSimulatedAd();
        }
      } else {
        // Fallback to simulated ad
        startSimulatedAd();
      }
    };

    initAd();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startSimulatedAd = () => {
    // Simulate video ad: 15 seconds total, skip after 5 seconds
    const totalDuration = 15000; // 15 seconds
    const skipAfter = 5000; // 5 seconds
    const interval = 100; // Update every 100ms

    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += interval;
      const currentProgress = (elapsed / totalDuration) * 100;
      setProgress(currentProgress);

      if (elapsed >= skipAfter && !canSkip) {
        setCanSkip(true);
      }

      if (elapsed >= totalDuration) {
        handleAdComplete();
      }
    }, interval);
  };

  const handleAdComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onAdComplete();
  };

  const handleSkip = () => {
    if (canSkip) {
      handleAdComplete();
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl mx-4">
        {/* Ad Container */}
        <Card className="bg-slate-900 border-purple-500/30 overflow-hidden">
          {/* Ad Content */}
          <div 
            ref={containerRef}
            className="relative bg-black aspect-video flex items-center justify-center"
          >
            {/* Google AdSense Placeholder */}
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', height: '100%' }}
              data-ad-client="ca-pub-1873423099734846"
              data-ad-slot="YOUR_AD_SLOT_ID"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />

            {/* Simulated Ad Visual (shown while loading or as fallback) */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <PlayCircle className="w-20 h-20 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Sponsored Ad</h3>
                <p className="text-gray-400 mb-4">
                  Support Code Flow by watching this ad
                </p>
                <div className="text-sm text-gray-500">
                  This is a simulated ad. Configure Google AdSense for real ads.
                </div>
              </div>
            </div>

            {/* Skip Button */}
            {canSkip && (
              <Button
                onClick={handleSkip}
                className="absolute bottom-4 right-4 bg-white/10 backdrop-blur hover:bg-white/20"
              >
                Skip Ad →
              </Button>
            )}

            {/* Skip Timer */}
            {!canSkip && progress < 33 && (
              <div className="absolute bottom-4 right-4 bg-black/70 px-4 py-2 rounded">
                <span className="text-sm text-gray-300">
                  You can skip in {Math.ceil((5000 - (progress * 150)) / 1000)}s
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <Button
                onClick={toggleMute}
                size="icon"
                variant="ghost"
                className="bg-white/10 backdrop-blur hover:bg-white/20"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Ad Info */}
          <div className="p-4 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/20 p-2 rounded">
                <PlayCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold">Earn +5 Free Uses</p>
                <p className="text-xs text-gray-400">
                  Watch to the end or skip after {canSkip ? '0' : '5'} seconds
                </p>
              </div>
            </div>

            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>
            💡 Ads help keep Code Flow free for everyone
          </p>
        </div>
      </div>
    </div>
  );
}
