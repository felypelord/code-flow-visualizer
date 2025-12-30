import { Request, Response } from 'express';
import { db } from '../../db';
import { users, adRewards, coinTransactions } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function trackAdImpression(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { adType, adProvider } = req.body;

    await db.insert(adRewards).values({ userId: userId || 'anonymous', adProvider: adProvider || 'google_adsense', rewardType: 'impression', rewardAmount: 0 });

    res.json({ success: true });
  } catch (error) {
    console.error('Track ad impression error:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
}

export async function verifyAdWatch(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { watchTime, adId, adProvider } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const minWatchTime = 5000;
    if (watchTime < minWatchTime) {
      return res.status(400).json({ error: 'Insufficient watch time', minRequired: minWatchTime, watched: watchTime });
    }

    await db.insert(adRewards).values({ userId, adProvider: adProvider || 'google_adsense', rewardType: 'verified_watch', rewardAmount: 0 });

    res.json({ success: true, verified: true, watchTime });
  } catch (error) {
    console.error('Verify ad watch error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

export async function getAdStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let canWatchIn = 0;
    if (user.lastAdWatched) {
      const cooldownMinutes = 5;
      const timeSinceLastAd = Date.now() - new Date(user.lastAdWatched).getTime();
      const cooldownMs = cooldownMinutes * 60 * 1000;
      if (timeSinceLastAd < cooldownMs) {
        canWatchIn = Math.ceil((cooldownMs - timeSinceLastAd) / 1000);
      }
    }

    res.json({ adsWatched: user.adsWatched || 0, usageGained: (user.adsWatched || 0) * 5, canWatchNow: canWatchIn === 0, canWatchIn, lastAdWatched: user.lastAdWatched, freeUsageCount: user.freeUsageCount || 0 });
  } catch (error) {
    console.error('Get ad stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

export async function skipAdForCoins(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const skipCost = 10;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.coins || 0) < skipCost) return res.status(400).json({ error: 'Insufficient coins', required: skipCost, current: user.coins || 0 });

    await db.update(users).set({ coins: (user.coins || 0) - skipCost, lastAdWatched: null }).where(eq(users.id, userId));

    await db.insert(coinTransactions).values({ userId, amount: -skipCost, type: 'spend', source: 'ad_skip', metadata: JSON.stringify({ action: 'skip_ad_cooldown' }) });

    res.json({ success: true, coinsSpent: skipCost, newBalance: (user.coins || 0) - skipCost, message: 'Ad cooldown reset! You can watch another ad now.' });
  } catch (error) {
    console.error('Skip ad for coins error:', error);
    res.status(500).json({ error: 'Failed to skip cooldown' });
  }
}
