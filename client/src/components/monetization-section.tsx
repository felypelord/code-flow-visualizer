import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Coins, Zap, Check } from 'lucide-react';
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
  type: 'subscription' | 'coins' | 'premium' | 'micro';
  items: string[];
  popular?: boolean;
  icon: any;
  coins?: number;
  duration?: string;
}

export default function MonetizationSection() {
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const PACKAGES: Package[] = [
    { id: 'pro_monthly', name: 'Pro Monthly', description: 'Full access to Code Flow', price: 200, currency: 'USD', type: 'subscription', duration: '1 month', icon: Crown, popular: true, items: ['Unlimited use of all features','Access to all Expert challenges','No ads','2x XP on all activities','Exclusive avatar and badges','Priority support'] },
    { id: 'pro_yearly', name: 'Pro Yearly', description: 'Save 40% on annual plan', price: 2400, currency: 'USD', type: 'subscription', duration: '1 year', icon: Crown, items: ['All Pro benefits','Save money on annual plan','Exclusive annual avatar','Founders badge','Early access to features'] },
    { id: 'coins_100', name: '100 FlowCoins', description: 'Basic coin pack', price: 100, currency: 'USD', type: 'coins', coins: 100, icon: Coins, items: ['100 FlowCoins','Buy hints and solutions','Unlock avatars','No expiration'] },
    { id: 'coins_500', name: '500 FlowCoins', description: '500 FlowCoins', price: 500, currency: 'USD', type: 'coins', coins: 500, icon: Coins, popular: true, items: ['500 FlowCoins','Best value','All basic package benefits'] },
    { id: 'coins_1000', name: '1000 FlowCoins', description: '1000 FlowCoins', price: 1000, currency: 'USD', type: 'coins', coins: 1000, icon: Coins, items: ['1000 FlowCoins','Maximum value','Supporter badge'] },
    { id: 'premium_lifetime', name: 'Pro Lifetime', description: 'Permanent access to Code Flow', price: 49900, currency: 'USD', type: 'premium', icon: Zap, items: ['Pro access forever','All future features included','Exclusive founders badge','Name in credits','VIP Discord access','No renewals or charges'] },
  ];

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const { t } = useLanguage();
  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast({
        title: t('auth.signIn', 'Sign in'),
        description: t('cosmetics.toast.mustSignInToBuy', 'You must be signed in to buy.'),
        variant: 'destructive',
      });
      const authButton = document.querySelector('[data-auth-trigger]') as HTMLButtonElement;
      if (authButton) authButton.click();
      return;
    }

    setLoading(packageId);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('auth.signIn', 'Sign in'),
          description: t('cosmetics.toast.mustSignInToBuy', 'You must be signed in to buy.'),
          variant: 'destructive',
        });
        const authButton = document.querySelector('[data-auth-trigger]') as HTMLButtonElement;
        if (authButton) authButton.click();
        return;
      }
      const response = await fetch('/api/monetization/create-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) throw new Error('Failed to create payment');

      const { checkoutUrl } = await response.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast({ title: 'Error', description: 'No checkout URL returned', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({ title: 'Error', description: 'Unable to process purchase', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => { initAdSense(); }, []);

  const handleWatchAd = async () => {
    if (!user) { 
      const authButton = document.querySelector('[data-auth-trigger]') as HTMLButtonElement;
      if (authButton) authButton.click();
      return; 
    }
    setShowAdModal(true);
  };

  const handleAdClose = () => { setShowAdModal(false); toast({ title: 'Ad cancelled', description: 'Watch until the end to earn rewards' }); };

  return (
    <div>
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">Unlock Your Full Potential</h1>
        <p className="text-xl text-gray-300">Choose the perfect plan to accelerate your learning</p>
      </div>

      {!user?.isPro && (
        <AdStatsWidget onWatchAd={handleWatchAd} isWatching={showAdModal} />
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PACKAGES.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <Card key={pkg.id} className={`p-6 bg-slate-800/80 backdrop-blur border-2 transition-all hover:scale-105 relative ${pkg.popular ? 'border-yellow-500 shadow-xl' : 'border-slate-700'}`}>
              {pkg.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 px-4 py-1 rounded-full text-xs font-bold">MOST POPULAR</div>}
              <div className="flex items-center justify-between mb-4"><Icon className="w-10 h-10 text-purple-400" />{pkg.type === 'subscription' && <span className="text-xs bg-purple-600 px-2 py-1 rounded">{pkg.duration}</span>}</div>
              <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-gray-400 mb-4 text-sm">{pkg.description}</p>
              <div className="mb-6"><span className="text-4xl font-bold">{formatPrice(pkg.price)}</span>{pkg.type === 'subscription' && <span className="text-gray-400 text-sm">/{pkg.duration}</span>}{pkg.coins && <span className="ml-2 text-yellow-400 text-sm">{pkg.coins} coins</span>}</div>
              <ul className="space-y-2 mb-6">{pkg.items.map((item, idx) => (<li key={idx} className="flex items-start gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-green-400 mt-0.5" />{item}</li>))}</ul>
              <Button onClick={() => handlePurchase(pkg.id)} disabled={loading === pkg.id || (user?.isPro && pkg.type === 'subscription')} className="w-full bg-gradient-to-r from-purple-600 to-pink-600">{loading === pkg.id ? 'Processing...' : user?.isPro && pkg.type === 'subscription' ? 'Already Pro' : 'Buy Now'}</Button>
            </Card>
          );
        })}
      </div>

      {showAdModal && <AdVideoPlayer onAdComplete={() => {}} onClose={handleAdClose} />}
    </div>
  );
}
