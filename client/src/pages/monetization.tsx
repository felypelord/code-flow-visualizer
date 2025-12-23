import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout';
import { Crown, Coins, Zap, Check, TrendingUp, Gift, PlayCircle, Lock, Code2, Search, Activity, Target, Award, Sparkles, BarChart3, Database, PauseCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdVideoPlayer } from '../components/ad-video-player';
import { AdStatsWidget } from '../components/ad-stats-widget';
import { initAdSense } from '@/lib/adsense';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'subscription' | 'coins' | 'premium';
  items: string[];
  popular?: boolean;
  icon: any;
  coins?: number;
  duration?: string;
}

const PACKAGES: Package[] = [
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    description: 'Full access to Code Flow',
    price: 1990,
    currency: 'BRL',
    type: 'subscription',
    duration: '1 month',
    icon: Crown,
    popular: true,
    items: [
      'Unlimited use of all features',
      'Access to all Expert challenges',
      'No ads',
      '2x XP on all activities',
      'Exclusive avatar and badges',
      'Priority support',
    ],
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    description: 'Save 40% on annual plan',
    price: 14390,
    currency: 'BRL',
    type: 'subscription',
    duration: '1 year',
    icon: Crown,
    items: [
      'All Pro benefits',
      'Save R$ 9.50/month',
      'Exclusive annual avatar',
      'Founders badge',
      'Early access to features',
    ],
  },
  {
    id: 'coins_100',
    name: '100 FlowCoins',
    description: 'Basic coin pack',
    price: 490,
    currency: 'BRL',
    type: 'coins',
    coins: 100,
    icon: Coins,
    items: [
      '100 FlowCoins',
      'Buy hints and solutions',
      'Unlock avatars',
      'No expiration',
    ],
  },
  {
    id: 'coins_500',
    name: '500 FlowCoins',
    description: '+50 bonus coins',
    price: 1990,
    currency: 'BRL',
    type: 'coins',
    coins: 550,
    icon: Coins,
    popular: true,
    items: [
      '550 FlowCoins (10% bonus)',
      'Best value',
      'All basic package benefits',
    ],
  },
  {
    id: 'coins_1000',
    name: '1000 FlowCoins',
    description: '+200 bonus coins',
    price: 3490,
    currency: 'BRL',
    type: 'coins',
    coins: 1200,
    icon: Coins,
    items: [
      '1200 FlowCoins (20% bonus)',
      'Maximum value',
      'Supporter badge',
    ],
  },
  {
    id: 'premium_lifetime',
    name: 'Pro Lifetime',
    description: 'Permanent access to Code Flow',
    price: 49900,
    currency: 'BRL',
    type: 'premium',
    icon: Zap,
    items: [
      'Pro access forever',
      'All future features included',
      'Exclusive founders badge',
      'Name in credits',
      'VIP Discord access',
      'No renewals or charges',
    ],
  },
];

export default function MonetizationPage() {
  const { user, refreshUser } = useUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to make purchases',
        variant: 'destructive',
      });
      return;
    }

    setLoading(packageId);

    try {
      const response = await fetch('/api/monetization/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) throw new Error('Failed to create payment');

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Error',
        description: 'Unable to process purchase',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    // Initialize AdSense on component mount
    initAdSense();
  }, []);

  const handleWatchAd = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to watch ads',
        variant: 'destructive',
      });
      return;
    }

    setShowAdModal(true);
  };

  const handleAdComplete = async () => {
    try {
      const response = await fetch('/api/monetization/watch-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          toast({
            title: 'Please wait',
            description: `You can watch another ad in ${Math.ceil(errorData.remainingSeconds / 60)} minutes`,
            variant: 'destructive',
          });
        } else {
          throw new Error(errorData.error || 'Failed to reward ad');
        }
        return;
      }

      const { usageAdded } = await response.json();

      toast({
        title: '🎉 Ad watched!',
        description: `+${usageAdded} usages unlocked!`,
      });

      await refreshUser();
    } catch (error) {
      console.error('Ad reward error:', error);
      toast({
        title: 'Error',
        description: 'Unable to process the reward',
        variant: 'destructive',
      });
    } finally {
      setShowAdModal(false);
    }
  };

  const handleAdClose = () => {
    setShowAdModal(false);
    toast({
      title: 'Ad cancelled',
      description: 'Watch until the end to earn rewards',
    });
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-gray-300">
            Choose the perfect plan to accelerate your learning
          </p>
        </div>

        {/* Ad Stats Widget (only for free users) */}
        {!user?.isPro && (
          <AdStatsWidget 
            onWatchAd={handleWatchAd}
            isWatching={showAdModal}
          />
        )}

        {/* Packages Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card
                key={pkg.id}
                className={`p-6 bg-slate-800/80 backdrop-blur border-2 transition-all hover:scale-105 relative ${
                  pkg.popular ? 'border-yellow-500 shadow-xl shadow-yellow-500/20' : 'border-slate-700'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-10 h-10 ${pkg.popular ? 'text-yellow-400' : 'text-purple-400'}`} />
                  {pkg.type === 'subscription' && (
                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                      {pkg.duration}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-gray-400 mb-4 text-sm">{pkg.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{formatPrice(pkg.price)}</span>
                  {pkg.type === 'subscription' && (
                    <span className="text-gray-400 text-sm">/{pkg.duration}</span>
                  )}
                  {pkg.coins && (
                    <span className="ml-2 text-yellow-400 text-sm">
                      {pkg.coins} coins
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {pkg.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading === pkg.id || (user?.isPro && pkg.type === 'subscription')}
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {loading === pkg.id ? (
                    'Processing...'
                  ) : user?.isPro && pkg.type === 'subscription' ? (
                    'Already Pro'
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Ad Video Player */}
        {showAdModal && (
          <AdVideoPlayer 
            onAdComplete={handleAdComplete}
            onClose={handleAdClose}
          />
        )}

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto mt-16 mb-12">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            What You Get with Pro
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Full access to professional tools, advanced challenges, and exclusive resources to accelerate your learning journey.
          </p>

          {/* Advanced Tools Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-purple-400" />
              Advanced Tools
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <BarChart3 className="w-12 h-12 text-blue-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Code Profiler</h4>
                <p className="text-sm text-gray-400">
                  Real-time performance analysis. Measure execution time, identify bottlenecks, and optimize your code with professional precision.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <PauseCircle className="w-12 h-12 text-red-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Advanced Debugger</h4>
                <p className="text-sm text-gray-400">
                  Conditional breakpoints, step-through debugging, and runtime variable inspection. Debug like a pro.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Sparkles className="w-12 h-12 text-yellow-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">AI Code Inspector</h4>
                <p className="text-sm text-gray-400">
                  Intelligent code analysis with AI. Identifies patterns, suggests improvements, and explains complex code automatically.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Search className="w-12 h-12 text-green-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Variable Inspector</h4>
                <p className="text-sm text-gray-400">
                  Explore complex objects, nested arrays and data structures with interactive visualization and advanced search.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Activity className="w-12 h-12 text-cyan-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Execution Visualizer</h4>
                <p className="text-sm text-gray-400">
                  Real-time execution visualization. See data flow, call stack and step-by-step transformations.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Database className="w-12 h-12 text-indigo-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Memory Inspector</h4>
                <p className="text-sm text-gray-400">
                  Memory tracking, heap analysis and leak detection. Understand how your code uses resources.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Code2 className="w-12 h-12 text-purple-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">VIP Playground</h4>
                <p className="text-sm text-gray-400">
                  Advanced testing environment with a scratchpad, saved snippets and isolated execution for unlimited experiments.
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Target className="w-12 h-12 text-orange-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Learning Paths</h4>
                <p className="text-sm text-gray-400">
                  Guided paths for Frontend, Backend and Algorithms. Structured progress from fundamentals to advanced projects.
                </p>
              </Card>
            </div>
          </div>

          {/* Learning & Content Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Content & Learning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">50+ Expert Challenges</h4>
                    <p className="text-sm text-gray-400">Advanced algorithms</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Complex Data Structures
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Advanced Design Patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Performance & Optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Async & Concurrency
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-500/20 p-3 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">2x XP Multiplier</h4>
                    <p className="text-sm text-gray-400">Progress faster</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Double XP on challenges
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Level up twice as fast
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Unlock achievements earlier
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Automatic ranking boost
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-pink-500/20 p-3 rounded-lg">
                    <Target className="w-8 h-8 text-pink-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Daily Challenges</h4>
                    <p className="text-sm text-gray-400">New daily challenges</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    A new challenge every day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    XP bonuses for streaks
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Exclusive rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Consistent practice
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Community & Rewards Section */}
          <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Gift className="w-6 h-6 text-pink-400" />
              Community & Exclusives
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Crown className="w-12 h-12 text-yellow-400 mb-4" />
                <h4 className="text-xl font-bold mb-3">Exclusive Avatars & Badges</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Stand out in the community with animated avatars, special badges, and customizations exclusive to Pro members.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    20+ exclusive avatars
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Verified Pro badge
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Animated profile frames
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Custom titles
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Sparkles className="w-12 h-12 text-cyan-400 mb-4" />
                <h4 className="text-xl font-bold mb-3">Premium Experience</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Seamless navigation, priority support, and early access to new features.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Zero ads on the platform
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Priority support 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Early access to features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Exclusive Discord server
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Activity className="w-12 h-12 text-green-400 mb-4" />
                <h4 className="text-xl font-bold mb-3">Unlimited Use</h4>
                <p className="text-sm text-gray-400 mb-4">
                  No usage limits. Run as much code as you want and access all features without limits.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Unlimited executions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    All tools unlocked
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    No cooldowns or waits
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Learn at your own pace
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
                <Lock className="w-12 h-12 text-purple-400 mb-4" />
                <h4 className="text-xl font-bold mb-3">Locked Content Unlocked</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Instant access to all previously locked content. Nothing left out.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    All Expert challenges
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Complete solutions with explanations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Advanced guided projects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Complete study materials
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Why Pro Section */}
          <Card className="p-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30 text-center">
            <h3 className="text-3xl font-bold mb-4">Why Choose Pro?</h3>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-6">
              Pro members learn <span className="text-yellow-400 font-bold">twice as fast</span>, have access to <span className="text-purple-400 font-bold">professional tools</span> used by industry developers, and join a <span className="text-pink-400 font-bold">exclusive community</span> of advanced learners.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-left">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg mt-1">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-bold">Time Savings</p>
                  <p className="text-sm text-gray-400">Tools that accelerate your learning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg mt-1">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-bold">Professional Skills</p>
                  <p className="text-sm text-gray-400">Learn with the same industry tools</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg mt-1">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-bold">Investment in Your Future</p>
                  <p className="text-sm text-gray-400">Boost your tech career</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Simple Benefits Grid - Keeping the original for continuity */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
            <TrendingUp className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Learn Faster</h3>
            <p className="text-gray-400">
              Access premium content and accelerate your learning with 2x XP
            </p>
          </Card>

          <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
            <Gift className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Exclusive Rewards</h3>
            <p className="text-gray-400">
              Unlock avatars, badges and special items for Pro members
            </p>
          </Card>

          <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/30">
            <Lock className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Exclusive Content</h3>
            <p className="text-gray-400">
              Access Expert challenges and advanced resources available only to Pro
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
