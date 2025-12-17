import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { progress } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRY = "7d";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid Authorization" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Signup
  app.post("/api/signup", async (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "username and password required" });
    if (password.length < 8) return res.status(400).json({ message: "password must be at least 8 characters" });
    
    const existing = await storage.getUserByUsername(username);
    if (existing) return res.status(409).json({ message: "user already exists" });
    
    // Hash password with bcrypt (10 rounds = ~100ms)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ username, password: hashedPassword });
    
    return res.json({ id: user.id, username: user.username });
  });

  // Login
  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "username and password required" });
    
    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(401).json({ message: "invalid credentials" });
    
    // Compare password with hashed version
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "invalid credentials" });
    
    // Generate JWT token (expires in 7 days)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    return res.json({ token, user: { id: user.id, username: user.username } });
  });

  // Current user
  app.get("/api/me", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "not found" });
    return res.json({ id: user.id, username: user.username });
  });

  // Save progress
  app.post("/api/progress", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { lessonId, language, index } = req.body || {};
    if (!lessonId || language === undefined || index === undefined) return res.status(400).json({ message: "lessonId, language and index required" });
    
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

  return httpServer;
}
