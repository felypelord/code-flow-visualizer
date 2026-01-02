/**
 * Admin endpoint para adicionar coins
 * IMPORTANTE: Este endpoint deve ter autenticação apropriada em produção
 */

import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/shared/schema';

export default (router: Router) => {
  router.post('/admin/dev/add-coins', async (req, res) => {
    try {
      const { email, amount } = req.body;
      
      if (!email || !amount) {
        return res.status(400).json({ error: 'email and amount required' });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found', email });
      }

      const newBalance = (user.coins || 0) + amount;
      await db.update(users).set({ coins: newBalance }).where(eq(users.id, user.id));

      res.json({
        success: true,
        email,
        userId: user.id,
        addedAmount: amount,
        previousBalance: user.coins || 0,
        newBalance
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};
