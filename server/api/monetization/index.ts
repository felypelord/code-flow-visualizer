import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../../db.js';
import { users, infinityPayPurchases, coinTransactions, adRewards, storePurchases } from '../../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

// Stripe configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

interface PackageConfig {
  price: number;
  coins?: number;
  proDuration?: number; // days
  type: 'subscription' | 'coins' | 'premium' | 'micro';
}

const PACKAGES: Record<string, PackageConfig> = {
  pro_monthly: { price: 200, proDuration: 30, type: 'subscription' },
  pro_yearly: { price: 2400, proDuration: 365, type: 'subscription' },
  coins_100: { price: 100, coins: 100, type: 'coins' },
  coins_500: { price: 500, coins: 500, type: 'coins' },
  coins_1000: { price: 1000, coins: 1000, type: 'coins' },
  premium_lifetime: { price: 49900, proDuration: 36500, type: 'premium' },
  hint: { price: 5, type: 'micro' },
  solution: { price: 10, type: 'micro' },
  roadmap_item: { price: 199, type: 'micro' },
};

export async function createPayment(req: Request, res: Response) {
  try {
    const { packageId, itemId, returnUrl } = req.body;
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const packageConfig = PACKAGES[packageId];
    if (!packageConfig) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      const simId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(infinityPayPurchases).values({
        userId,
        transactionId: simId,
        packageId,
        amount: packageConfig.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'simulated',
        metadata: JSON.stringify({ simulated: true, packageId, itemId }),
      });

      await applyPackageBenefits(userId, packageId, itemId || '', simId);

      return res.json({
        sessionId: simId,
        checkoutUrl: `${APP_URL}/monetization/simulated?session_id=${simId}`,
        simulated: true,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: getPackageName(packageId),
              description: getPackageDescription(packageId),
            },
            unit_amount: packageConfig.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/monetization/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/monetization`,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        packageId,
        itemId: itemId || '',
        returnUrl: returnUrl || '',
        type: packageConfig.type,
      },
    });

    await db.insert(infinityPayPurchases).values({
      userId,
      transactionId: session.id,
      packageId,
      amount: packageConfig.price,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'stripe',
      metadata: JSON.stringify({ sessionId: session.id }),
    });

    res.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Create payment error:', errorMsg);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to create payment', details: errorMsg });
  }
}

async function applyPackageBenefits(userId: string, packageId: string, itemId: string, transactionId: string) {
  const packageConfig = PACKAGES[packageId];
  if (!packageConfig) return;

  if (packageConfig.type === 'subscription' || packageConfig.type === 'premium') {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (packageConfig.proDuration || 30));

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    await db.update(users).set({ isPro: true, proExpiresAt: expiresAt, premiumPurchases: (user?.premiumPurchases || 0) + 1 }).where(eq(users.id, userId));
  } else if (packageConfig.type === 'coins') {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    await db.update(users).set({ coins: (user?.coins || 0) + (packageConfig.coins || 0), premiumPurchases: (user?.premiumPurchases || 0) + 1 }).where(eq(users.id, userId));
    await db.insert(coinTransactions).values({ userId, amount: packageConfig.coins || 0, type: 'earn', source: 'purchase', metadata: JSON.stringify({ packageId, transactionId }) });
  } else if (packageConfig.type === 'micro') {
    const item = itemId || packageId;
    try {
      await db.insert(storePurchases).values({ userId, itemId: String(item), itemType: 'micro', xpCost: 0, coinCost: 0 });
    } catch (err) {
      console.error('Failed to record simulated micro purchase:', err);
    }
  }
}

function getPackageName(packageId: string): string {
  const names: Record<string, string> = {
    pro_monthly: 'Code Flow Pro - Mensal',
    pro_yearly: 'Code Flow Pro - Anual',
    coins_100: '100 FlowCoins',
    coins_500: '500 FlowCoins',
    coins_1000: '1000 FlowCoins',
    premium_lifetime: 'Code Flow Pro - Vitalício',
    hint: 'Exercise Hint (single)',
    solution: 'Exercise Solution (single)',
  };
  return names[packageId] || 'Code Flow Package';
}

function getPackageDescription(packageId: string): string {
  const descriptions: Record<string, string> = {
    pro_monthly: 'Acesso ilimitado por 1 mês',
    pro_yearly: 'Acesso ilimitado por 1 ano (economize 40%)',
    coins_100: 'Compre hints, soluções e avatares',
    coins_500: '500 FlowCoins',
    coins_1000: '1000 FlowCoins',
    premium_lifetime: 'Acesso ilimitado para sempre',
    hint: 'Unlock one hint for an exercise',
    solution: 'Unlock the full solution for an exercise',
  };
  return descriptions[packageId] || 'Code Flow Premium';
}

export async function stripeWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = (req as any).rawBody;

    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const packageId = session.metadata?.packageId;
      const itemId = (session.metadata as any)?.itemId || '';

      if (!userId || !packageId) {
        console.error('Missing userId or packageId in session metadata');
        return res.status(400).json({ error: 'Invalid session metadata' });
      }

      await db.update(infinityPayPurchases).set({ status: 'completed', completedAt: new Date(), metadata: JSON.stringify(session) }).where(eq(infinityPayPurchases.transactionId, session.id));

      const metadataItemId = (session.metadata as any)?.itemId || '';
      const packageConfig = PACKAGES[packageId];

      if (packageConfig && packageConfig.type === 'micro') {
        try {
          await db.insert(storePurchases).values({ userId: String(userId), itemId: metadataItemId || packageId, itemType: 'micro', xpCost: 0, coinCost: 0 });
        } catch (recErr) {
          console.error('Failed to record micro purchase in store_purchases:', recErr);
        }
      }

      if (!packageConfig) {
        throw new Error('Invalid package');
      }

      if (packageConfig.type === 'subscription' || packageConfig.type === 'premium') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + packageConfig.proDuration!);

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        await db.update(users).set({ isPro: true, proExpiresAt: expiresAt, premiumPurchases: (user?.premiumPurchases || 0) + 1 }).where(eq(users.id, userId));
      } else if (packageConfig.type === 'coins') {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        await db.update(users).set({ coins: (user?.coins || 0) + packageConfig.coins!, premiumPurchases: (user?.premiumPurchases || 0) + 1 }).where(eq(users.id, userId));

        await db.insert(coinTransactions).values({ userId, amount: packageConfig.coins!, type: 'earn', source: 'purchase', metadata: JSON.stringify({ packageId, sessionId: session.id }) });
      } else if (packageConfig.type === 'micro') {
        const itemId = (session.metadata && (session.metadata.itemId || session.metadata.item)) || packageId;
        try {
          await db.insert(storePurchases).values({ userId, itemId: String(itemId), itemType: 'micro', xpCost: 0, coinCost: 0 });
        } catch (err) {
          console.error('Failed to record micro purchase in store_purchases:', err);
        }
      }

      console.log(`✅ Payment completed for user ${userId}, package ${packageId}`);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;

      await db.update(infinityPayPurchases).set({ status: 'failed' }).where(eq(infinityPayPurchases.transactionId, session.id));
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function confirmPurchase(req: Request, res: Response) {
  try {
    const sessionId = (req.body && req.body.sessionId) || (req.query && req.query.session_id);
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });
    if (!process.env.STRIPE_SECRET_KEY && String(sessionId).startsWith('sim_')) {
      const [rec] = await db.select().from(infinityPayPurchases).where(eq(infinityPayPurchases.transactionId, String(sessionId))).limit(1);
      if (!rec) return res.json({ ok: false, paid: false, metadata: {} });
      return res.json({ ok: true, paid: rec.status === 'completed', metadata: rec.metadata ? JSON.parse(String(rec.metadata)) : {} });
    }

    const session = await stripe.checkout.sessions.retrieve(String(sessionId));
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    return res.json({ ok: true, paid, metadata: session.metadata || {} });
  } catch (err: any) {
    console.error('confirmPurchase error:', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export async function watchAd(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.lastAdWatched) {
      const cooldownMinutes = 5;
      const timeSinceLastAd = Date.now() - new Date(user.lastAdWatched).getTime();
      const cooldownMs = cooldownMinutes * 60 * 1000;

      if (timeSinceLastAd < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastAd) / 1000);
        return res.status(429).json({ error: 'Cooldown active', remainingSeconds });
      }
    }

    const usageAdded = 5;
    await db.update(users).set({ freeUsageCount: sql`${users.freeUsageCount} + ${usageAdded}`, adsWatched: sql`${users.adsWatched} + 1`, lastAdWatched: new Date() }).where(eq(users.id, userId));

    await db.insert(adRewards).values({ userId, adProvider: 'google_adsense', rewardType: 'watch', rewardAmount: 0 });

    res.json({ success: true, added: usageAdded });
  } catch (error) {
    console.error('watchAd error:', error);
    res.status(500).json({ error: 'Failed to record ad watch' });
  }
}

export async function checkUsage(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return res.json({ usage: user?.freeUsageCount || 0, coins: user?.coins || 0, isPro: user?.isPro || false });
  } catch (err) {
    console.error('checkUsage error:', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
}

export async function consumeUsage(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const amount = Number(req.body.amount || 1);
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.freeUsageCount || 0) < amount) return res.status(400).json({ error: 'Not enough usage' });

    await db.update(users).set({ freeUsageCount: sql`${users.freeUsageCount} - ${amount}` }).where(eq(users.id, userId));
    await db.insert(coinTransactions).values({ userId, amount: 0, type: 'spend', source: 'usage' });

    res.json({ success: true });
  } catch (err) {
    console.error('consumeUsage error:', err);
    res.status(500).json({ error: 'Failed to consume usage' });
  }
}

export async function confirmPurchaseEndpoint(req: Request, res: Response) {
  return confirmPurchase(req, res as any);
}
