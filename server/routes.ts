import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { progress } from "@shared/schema";
import { storage } from "./storage";

// JWT secret - must come from environment in all environments
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set via environment variable");
}
const JWT_EXPIRY = "7d";
const METRICS_TOKEN = process.env.METRICS_TOKEN || "";

// Simple in-memory rate limiter (per key)
type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

const usernameSchema = z.string().min(3).max(50);
const strongPassword = z
  .string()
  .min(10)
  .regex(/[A-Za-z]/, "must include letters")
  .regex(/[0-9]/, "must include numbers");

const signupSchema = z.object({
  username: usernameSchema,
  password: strongPassword,
});

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1),
});

const progressSchema = z.object({
  lessonId: z.string().min(1),
  language: z.string().min(1),
  index: z.number().int().nonnegative().max(10_000),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid Authorization" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requirePro(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid Authorization" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    (req as any).userId = decoded.userId;
    // Will check isPro in route handler after fetching user
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health checks
  app.get("/health", (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    res.json({
      ok: true,
      status: "ok",
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      env: process.env.NODE_ENV || "development",
      port: process.env.PORT || "5000",
      timestamp: new Date().toISOString(),
    });
  });

  app.head("/health", (_req: Request, res: Response) => {
    res.status(204).end();
  });

  // API health (useful for existing API logging)
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Basic JSON metrics (in-memory, dev-only style)
  app.get("/metrics", (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
      if (!METRICS_TOKEN || token !== METRICS_TOKEN) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const mem = process.memoryUsage();
    const m = (app as any).locals?.metrics || {};
    res.json({
      ok: true,
      pid: process.pid,
      env: process.env.NODE_ENV || "development",
      uptimeSec: Math.round(process.uptime()),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
      slowRequestMs: Number(process.env.SLOW_REQUEST_MS || 2000),
      metrics: m,
      timestamp: new Date().toISOString(),
    });
  });

  // Signup
  app.post("/api/signup", async (req: Request, res: Response) => {
    if (!checkRateLimit(`signup:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many signup attempts" });
    }
    const parsed = signupSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid signup data" });
    const { username, password } = parsed.data;
    
    const existing = await storage.getUserByUsername(username);
    if (existing) return res.status(409).json({ message: "user already exists" });
    
    // Hash password with bcrypt (10 rounds = ~100ms)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ username, password: hashedPassword });
    
    return res.json({ id: user.id, username: user.username });
  });

  // Login
  app.post("/api/login", async (req: Request, res: Response) => {
    if (!checkRateLimit(`login:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: "Too many login attempts" });
    }
    const parsed = loginSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "username and password required" });
    const { username, password } = parsed.data;
    
    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(401).json({ message: "invalid credentials" });
    
    // Compare password with hashed version
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "invalid credentials" });
    
    // Generate JWT token (expires in 7 days)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
    
    return res.json({ token, user: { id: user.id, username: user.username } });
  });

  // Current user
  app.get("/api/me", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "not found" });
    
    const isPro = user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
    
    return res.json({ 
      id: user.id, 
      username: user.username,
      isAdmin: user.isAdmin,
      isPro
    });
  });

  // Save progress
  app.post("/api/progress", requireAuth, async (req: Request, res: Response) => {
    const parsed = progressSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid progress payload" });
    const { lessonId, language, index } = parsed.data;
    const userId = (req as any).userId as string;
    
    // Upsert: update if exists, insert if not
    const existing = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId), eq(progress.language, language)))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(progress)
        .set({ stepIndex: index, updatedAt: new Date() })
        .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId), eq(progress.language, language)));
    } else {
      await db.insert(progress).values({
        userId,
        lessonId,
        language,
        stepIndex: index,
      });
    }
    
    return res.json({ ok: true });
  });

  // Get progress
  app.get("/api/progress", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const userProgress = await db.select().from(progress).where(eq(progress.userId, userId));
    
    // Convert to map format: "lessonId:language" -> stepIndex
    const map: Record<string, number> = {};
    userProgress.forEach((p) => {
      map[`${p.lessonId}:${p.language}`] = p.stepIndex;
    });
    
    return res.json(map);
  });

  // Check Pro status
  app.get("/api/pro/status", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const isPro = user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
    
    return res.json({
      isPro,
      expiresAt: user.proExpiresAt,
      plan: isPro ? "pro" : "free"
    });
  });

  // Upgrade to Pro (simulated - in real world use Stripe webhook)
  app.post("/api/pro/upgrade", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { months = 1 } = req.body;
    
    if (!months || months < 1 || months > 36) {
      return res.status(400).json({ message: "Invalid months (1-36)" });
    }
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    
    // Update user
    await db.update(users)
      .set({
        isPro: true,
        proExpiresAt: expiresAt
      })
      .where(eq(users.id, userId));
    
    return res.json({
      success: true,
      isPro: true,
      expiresAt: expiresAt.toISOString(),
      plan: "pro"
    });
  });

  // Cancel Pro subscription
  app.post("/api/pro/cancel", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    
    await db.update(users)
      .set({
        isPro: false,
        proExpiresAt: null
      })
      .where(eq(users.id, userId));
    
    return res.json({
      success: true,
      isPro: false,
      plan: "free"
    });
  });

  return httpServer;
}
