import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { authenticateToken } from '@/server/auth';

export default (router: Router) => {
  /**
   * POST /api/coins/add
   * Admin only: Add coins to a user account
   * Body: { userId: string, amount: number, reason?: string }
   */
  router.post('/coins/add', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;
      const currentUserId = req.user?.id;

      // Verify request body
      if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid userId or amount' });
      }

      // SECURITY: Check if user is admin
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, currentUserId),
      });

      if (!currentUser?.isAdmin) {
        console.warn(`[SECURITY] Unauthorized coin addition attempt by ${currentUserId}`);
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      // Get user and update coins
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const newBalance = (user.coins || 0) + amount;

      await db.update(users).set({ coins: newBalance }).where(eq(users.id, userId));

      // Log the transaction
      console.log(`[COINS] Added ${amount} coins to ${user.email} (reason: ${reason || 'no reason provided'}). New balance: ${newBalance}`);

      res.json({
        success: true,
        userId,
        addedAmount: amount,
        previousBalance: user.coins || 0,
        newBalance,
        reason: reason || 'Manual addition'
      });
    } catch (error) {
      console.error('Error adding coins:', error);
      res.status(500).json({ error: 'Failed to add coins' });
    }
  });
};
