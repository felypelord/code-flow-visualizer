import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../../server/db.js';
import { roadmapProgress, storePurchases, users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const ROADMAP_FILE = path.join(process.cwd(), 'server', 'data', 'roadmap.json');

async function loadRoadmap() {
  const raw = await fs.readFile(ROADMAP_FILE, 'utf-8');
  const items = JSON.parse(raw);
  return items;
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

    // Learning paths are now FREE for everyone!
    // No Pro restriction - democratizing education
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

    // Insert a record (no duplicates check for simplicity)
    await db.insert(roadmapProgress).values({ userId, pathId, itemSlug, status: 'completed' });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('completeProgress error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
}

export default {};
