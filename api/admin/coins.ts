import type { ApiRequest, ApiResponse } from '../_types';
import { eq } from 'drizzle-orm';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../shared/schema';

// Neon configuration for edge functions
neonConfig.useSecureWebSocket = false;

const connectionString = process.env.DATABASE_URL || '';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userId, email, amount, reason } = req.body;

    // Basic validation
    if (!action || !process.env.ADMIN_SECRET || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Setup database
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    if (action === 'add-coins') {
      if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid userId or amount' });
      }

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const newBalance = (user.coins || 0) + amount;

      // Update coins
      await db.update(schema.users).set({ coins: newBalance }).where(eq(schema.users.id, userId));

      console.log(`[ADMIN] Added ${amount} coins to ${user.email}. New balance: ${newBalance}. Reason: ${reason}`);

      return res.json({
        success: true,
        userId,
        email: user.email,
        addedAmount: amount,
        previousBalance: user.coins || 0,
        newBalance,
        reason: reason || 'Manual addition'
      });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('[ADMIN API Error]', error);
    return res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown' });
  }
}
