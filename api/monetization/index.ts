import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../../server/db.js';
import { users, infinityPayPurchases, coinTransactions, adRewards, storePurchases } from '../../shared/schema.js';
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
  pro_monthly: { price: 1990, proDuration: 30, type: 'subscription' },
  pro_yearly: { price: 14390, proDuration: 365, type: 'subscription' },
  coins_100: { price: 490, coins: 100, type: 'coins' },
  coins_500: { price: 1990, coins: 550, type: 'coins' },
  coins_1000: { price: 3490, coins: 1200, type: 'coins' },
  premium_lifetime: { price: 49900, proDuration: 36500, type: 'premium' }, // 100 years
  // Micro purchases for individual exercise hints/solutions (prices in cents)
  hint: { price: 5, type: 'micro' },
  solution: { price: 10, type: 'micro' },
  roadmap_item: { price: 199, type: 'micro' },
};

export async function createPayment(req: Request, res: Response) {
  try {
    const { packageId, itemId } = req.body;
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const packageConfig = PACKAGES[packageId];
    if (!packageConfig) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: getPackageName(packageId),
              description: getPackageDescription(packageId),
            },
            unit_amount: packageConfig.price, // valor em centavos
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
        type: packageConfig.type,
      },
    });

    // Store purchase record
    await db.insert(infinityPayPurchases).values({
      userId,
      transactionId: session.id,
      packageId,
      amount: packageConfig.price,
      currency: 'BRL',
      status: 'pending',
      paymentMethod: 'stripe',
      metadata: JSON.stringify({ sessionId: session.id }),
    });

    // If a micro purchase (itemId) was provided, also return that info in response

    res.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
}

function getPackageName(packageId: string): string {
  const names: Record<string, string> = {
    pro_monthly: 'Code Flow Pro - Mensal',
    pro_yearly: 'Code Flow Pro - Anual',
    coins_100: '100 FlowCoins',
    coins_500: '500 FlowCoins (+50 bônus)',
    coins_1000: '1000 FlowCoins (+200 bônus)',
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
    coins_500: '550 FlowCoins com 10% de bônus',
    coins_1000: '1200 FlowCoins com 20% de bônus',
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
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const packageId = session.metadata?.packageId;
      const itemId = (session.metadata as any)?.itemId || '';

      if (!userId || !packageId) {
        console.error('Missing userId or packageId in session metadata');
        return res.status(400).json({ error: 'Invalid session metadata' });
      }

      // Update purchase status
      await db
        .update(infinityPayPurchases)
        .set({
          status: 'completed',
          completedAt: new Date(),
          metadata: JSON.stringify(session),
        })
        .where(eq(infinityPayPurchases.transactionId, session.id));

      // If this was a micro purchase (hint/solution), record it in store_purchases
      const metadataItemId = (session.metadata as any)?.itemId || '';
      // Determine package config
      const packageConfig = PACKAGES[packageId];

      if (packageConfig && packageConfig.type === 'micro') {
        try {
          // itemId should be something like 'exercise:<id>' or custom identifier
          await db.insert(storePurchases).values({
            userId: String(userId),
            itemId: metadataItemId || packageId,
            itemType: 'micro',
            xpCost: 0,
            coinCost: 0,
          });
        } catch (recErr) {
          console.error('Failed to record micro purchase in store_purchases:', recErr);
        }
      }
      // Grant benefits
      if (!packageConfig) {
        throw new Error('Invalid package');
      }

      if (packageConfig.type === 'subscription' || packageConfig.type === 'premium') {
        // Grant Pro status
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + packageConfig.proDuration!);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        await db
          .update(users)
          .set({
            isPro: true,
            proExpiresAt: expiresAt,
            premiumPurchases: (user?.premiumPurchases || 0) + 1,
          })
          .where(eq(users.id, userId));
      } else if (packageConfig.type === 'coins') {
        // Add coins
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        await db
          .update(users)
          .set({
            coins: (user?.coins || 0) + packageConfig.coins!,
            premiumPurchases: (user?.premiumPurchases || 0) + 1,
          })
          .where(eq(users.id, userId));

        // Log transaction
        await db.insert(coinTransactions).values({
          userId,
          amount: packageConfig.coins!,
          type: 'earn',
          source: 'purchase',
          metadata: JSON.stringify({ packageId, sessionId: session.id }),
        });
      
      } else if (packageConfig.type === 'micro') {
        // Micro purchase (hint/solution). We expect session.metadata.itemId to indicate which item/exercise.
        const itemId = (session.metadata && (session.metadata.itemId || session.metadata.item)) || packageId;
        try {
          await db.insert(storePurchases).values({
            userId,
            itemId: String(itemId),
            itemType: 'micro',
            xpCost: 0,
            coinCost: 0,
          });
        } catch (err) {
          console.error('Failed to record micro purchase in store_purchases:', err);
        }
      }

      console.log(`✅ Payment completed for user ${userId}, package ${packageId}`);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;

      await db
        .update(infinityPayPurchases)
        .set({ status: 'failed' })
        .where(eq(infinityPayPurchases.transactionId, session.id));
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function watchAd(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check cooldown (1 ad per 5 minutes)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.lastAdWatched) {
      const cooldownMinutes = 5;
      const timeSinceLastAd = Date.now() - new Date(user.lastAdWatched).getTime();
      const cooldownMs = cooldownMinutes * 60 * 1000;

      if (timeSinceLastAd < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastAd) / 1000);
        return res.status(429).json({
          error: 'Cooldown active',
          remainingSeconds,
        });
      }
    }

    // Add 5 uses
    const usageAdded = 5;
    await db
      .update(users)
      .set({
        freeUsageCount: sql`${users.freeUsageCount} + ${usageAdded}`,
        adsWatched: sql`${users.adsWatched} + 1`,
        lastAdWatched: new Date(),
      })
      .where(eq(users.id, userId));

    // Log ad reward
    await db.insert(adRewards).values({
      userId,
      adProvider: 'google_adsense',
      rewardType: 'usage_unlock',
      rewardAmount: usageAdded,
    });

    res.json({
      success: true,
      usageAdded,
      newUsageCount: (user.freeUsageCount || 0) + usageAdded,
    });
  } catch (error) {
    console.error('Watch ad error:', error);
    res.status(500).json({ error: 'Failed to process ad reward' });
  }
}

export async function checkUsage(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Pro users have unlimited usage
    if (user.isPro) {
      return res.json({
        canUse: true,
        isPro: true,
        unlimited: true,
      });
    }

    // Free users check usage count
    const canUse = user.freeUsageCount > 0;

    res.json({
      canUse,
      isPro: false,
      remainingUses: user.freeUsageCount,
      needsAd: !canUse,
    });
  } catch (error) {
    console.error('Check usage error:', error);
    res.status(500).json({ error: 'Failed to check usage' });
  }
}

export async function consumeUsage(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Pro users don't consume usage
    if (user.isPro) {
      return res.json({ success: true, isPro: true });
    }

    // Check if user has usage available
    if (user.freeUsageCount <= 0) {
      return res.status(403).json({
        error: 'No usage available',
        needsAd: true,
      });
    }

    // Consume one use
    await db
      .update(users)
      .set({
        freeUsageCount: sql`${users.freeUsageCount} - 1`,
      })
      .where(eq(users.id, userId));
    res.json({
      success: true,
      remainingUses: user.freeUsageCount - 1,
    });
  } catch (error) {
    console.error('Consume usage error:', error);
    res.status(500).json({ error: 'Failed to consume usage' });
  }
}
