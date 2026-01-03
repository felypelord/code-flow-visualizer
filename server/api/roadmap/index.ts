import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../../db.js';
import { roadmapProgress, storePurchases, users, activityHistory } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';

const ROADMAP_FILE = path.join(process.cwd(), 'server', 'data', 'roadmap.json');

async function loadRoadmap() {
  const raw = await fs.readFile(ROADMAP_FILE, 'utf-8');
  const items = JSON.parse(raw);
  return items;
}

// Calculate level from XP (same as in routes.ts)
function calculateLevel(xp: number): number {
  if (xp < 100) return 1; // Rookie
  if (xp < 500) return 2; // Coder
  if (xp < 1500) return 3; // Developer
  if (xp < 3000) return 4; // Engineer
  if (xp < 10000) return 5; // Architect
  return 6; // Legend
}

export async function getRoadmap(req: Request, res: Response) {
  try {
    const items = await loadRoadmap();
    return res.json({ items });
  } catch (err: any) {
    console.error('Failed to load roadmap:', err);
    return res.status(500).json({ error: 'Failed to load roadmap' });
  }
}

export async function getRoadmapItem(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    const items = await loadRoadmap();
    const item = items.find((i: any) => i.slug === slug);
    if (!item) return res.status(404).json({ error: 'Not found' });

    if (item.proOnly) {
      const userId = (req as any).userId || (req as any).user?.id;
      if (!userId) {
        const preview = { ...item, content: undefined, quiz: undefined };
        return res.json({ item: preview, locked: true });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user?.isPro) return res.json({ item, locked: false });

      const purchases = await db.select().from(storePurchases).where(eq(storePurchases.userId, String(userId)));
      const has = purchases.some(p => p.itemId === `roadmap:${slug}`);
      if (has) return res.json({ item, locked: false });

      const preview = { ...item, content: undefined, quiz: undefined };
      return res.json({ item: preview, locked: true });
    }

    return res.json({ item, locked: false });
  } catch (err: any) {
    console.error('getRoadmapItem error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
}

export async function getProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const pathId = String(req.query.pathId || '');
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!pathId) return res.status(400).json({ error: 'Missing pathId' });

    const rows = await db.select().from(roadmapProgress).where(eq(roadmapProgress.userId, userId));
    const completed = rows.filter(r => r.pathId === pathId).length;
    return res.json({ completed });
  } catch (err: any) {
    console.error('getProgress error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
}

export async function completeProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { pathId, itemSlug } = req.body;
    if (!pathId || !itemSlug) return res.status(400).json({ error: 'Missing pathId or itemSlug' });

    // Mark exercise as completed
    await db.insert(roadmapProgress).values({ userId, pathId, itemSlug, status: 'completed' });

    // Get user and award XP
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      const baseXP = 25; // Base XP per exercise
      const newXP = (user.xp || 0) + baseXP;
      const newLevel = calculateLevel(newXP);
      
      // Update user XP and level
      await db.update(users).set({
        xp: newXP,
        level: newLevel,
        totalExercises: (user.totalExercises || 0) + 1,
      }).where(eq(users.id, userId));
      
      // Record activity
      await db.insert(activityHistory).values({
        userId,
        type: 'exercise',
        title: `Exercício completado: ${itemSlug}`,
        xpEarned: baseXP,
        timeSpent: 0,
      });

      return res.json({ 
        success: true,
        xpAwarded: baseXP,
        newXP,
        newLevel,
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('completeProgress error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
}

export default {};
