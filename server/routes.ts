import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { progress, users, webhookEvents, stripeCustomers } from "../shared/schema";
import { storage } from "./storage";
import { getStripe, getBaseUrl, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_MONTHLY_USD, STRIPE_WEBHOOK_SECRET } from "./stripe";
import Stripe from "stripe";
import { Resend } from "resend";

// JWT secret - must come from environment in all environments
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set via environment variable");
}
const JWT_EXPIRY = "7d";
const METRICS_TOKEN = process.env.METRICS_TOKEN || "";
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 4000);

// Resend configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Resend email sending function
async function sendVerificationEmail(email: string, code: string, firstName: string): Promise<boolean> {
  try {
    if (!resend) {
      console.warn("⚠️  Resend API key not configured. Logging code instead.");
      console.log(`📧 [MOCK] Verification code for ${email}: ${code}`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for signing up. To verify your email address and complete your registration, please enter the following code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #333; margin: 0; font-family: monospace;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this verification code, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("✗ Failed to send verification email:", error.message);
      return false;
    }

    console.log(`✓ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("✗ Error sending verification email:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function sendVerificationEmailWithTimeout(email: string, code: string, firstName: string): Promise<boolean> {
  return Promise.race([
    sendVerificationEmail(email, code, firstName),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), EMAIL_SEND_TIMEOUT_MS)),
  ]);
}

// Resend password reset email
async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  try {
    if (!resend) {
      console.warn("⚠️  Resend API key not configured. Logging code instead.");
      console.log(`🔐 [MOCK] Password reset code for ${email}: ${code}`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset the password for your account. To proceed, please enter the following code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #333; margin: 0; font-family: monospace;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("✗ Failed to send password reset email:", error.message);
      return false;
    }

    console.log(`✓ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("✗ Error sending password reset email:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function sendPasswordResetEmailWithTimeout(email: string, code: string): Promise<boolean> {
  return Promise.race([
    sendPasswordResetEmail(email, code),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), EMAIL_SEND_TIMEOUT_MS)),
  ]);
}

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
const emailSchema = z.string().email().max(255);
const strongPassword = z
  .string()
  .min(10)
  .regex(/[A-Za-z]/, "must include letters")
  .regex(/[0-9]/, "must include numbers");

const signupSchema = z.object({
  email: emailSchema,
  password: strongPassword,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  country: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const progressSchema = z.object({
  lessonId: z.string().min(1),
  language: z.string().min(1),
  index: z.number().int().nonnegative().max(10_000),
});

const sendVerificationCodeSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  country: z.string().min(1).max(100),
  password: strongPassword,
});

const verifyCodeSchema = z.object({
  email: emailSchema,
  code: z.string().min(6).max(6),
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

  // Send verification code (step 1 of signup)
  app.post("/api/signup", async (req: Request, res: Response) => {
    console.log("[DEBUG] /api/signup called");
    if (!checkRateLimit(`signup:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many signup attempts" });
    }
    const parsed = sendVerificationCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid signup data" });
    const { email, firstName, lastName, dateOfBirth, country, password } = parsed.data;
    console.log("[DEBUG] checking if email exists:", email);
    
    const existing = await storage.getUserByEmail(email);
    console.log("[DEBUG] existing user:", existing ? "YES" : "NO");
    if (existing) return res.status(409).json({ message: "email already exists" });
    
    // Generate verification code
    const code = generateVerificationCode();
    console.log("[DEBUG] creating email verification for:", email);
    await storage.createEmailVerification(email, code);
    console.log("[DEBUG] email verification created, code:", code);
    
    // Send email (mock for now) with timeout in background (do not block response)
    // We intentionally do not await here to avoid request timeouts
    sendVerificationEmailWithTimeout(email, code, firstName)
      .then((sent) => {
        if (!sent) console.warn(`verification email send timed out for ${email}`);
      })
      .catch((err) => {
        console.warn(`verification email send failed for ${email}: ${err?.message || err}`);
      });

    console.log("[DEBUG] /api/signup returning success");
    return res.json({ message: "Verification code sent to your email" });
  });

  // Verify code and create account (step 2 of signup)
  app.post("/api/verify-code", async (req: Request, res: Response) => {
    if (!checkRateLimit(`verify:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: "Too many verification attempts" });
    }
    const parsed = verifyCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid verification data" });
    const { email, code } = parsed.data;
    
    // Verify the code
    const isValid = await storage.verifyEmail(email, code);
    if (!isValid) {
      const verification = await storage.getEmailVerification(email);
      if (verification && verification.attempts >= 5) {
        await storage.deleteEmailVerification(email);
        return res.status(429).json({ message: "Too many failed attempts, please request a new code" });
      }
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    
    // If we get here, email is verified, we should have stored the signup data somewhere
    // For now, we'll return success and expect the client to send full signup data again
    return res.json({ message: "Email verified successfully" });
  });

  // Complete signup with all data
  app.post("/api/complete-signup", async (req: Request, res: Response) => {
    if (!checkRateLimit(`signup:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many signup attempts" });
    }
    const parsed = sendVerificationCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid signup data" });
    const { email, firstName, lastName, dateOfBirth, country, password } = parsed.data;
    
    // Check if email is verified
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Email should be verified before this, so we create the account
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        country,
      });
      
      // Generate JWT token
      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
      return res.json({ token, user: { id: newUser.id, email: newUser.email, firstName, lastName } });
    }
    
    return res.status(409).json({ message: "Account already exists" });
  });

  // Login
  app.post("/api/login", async (req: Request, res: Response) => {
    if (!checkRateLimit(`login:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: "Too many login attempts" });
    }
    const parsed = loginSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "email and password required" });
    const { email, password } = parsed.data;
    
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: "invalid credentials" });
    
    // Compare password with hashed version
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "invalid credentials" });
    
    // Generate JWT token (expires in 7 days)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
    
    return res.json({ token, user: { id: user.id, email: user.email } });
  });

  // Forgot password - send reset code
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    if (!checkRateLimit(`forgot:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many requests" });
    }
    const parsed = z.object({ email: emailSchema }).safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid email" });
    const { email } = parsed.data;
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: "If email exists, reset code will be sent" });
    }
    
    // Generate verification code
    const code = generateVerificationCode();
    await storage.createPasswordReset(email, code);
    
    // Send email with timeout in background (non-blocking)
    sendPasswordResetEmailWithTimeout(email, code)
      .then((sent) => {
        if (!sent) console.warn(`password reset email send timed out for ${email}`);
      })
      .catch((err) => {
        console.warn(`password reset email send failed for ${email}: ${err?.message || err}`);
      });
    
    return res.json({ message: "Reset code sent to your email" });
  });

  // Verify password reset code
  app.post("/api/verify-reset-code", async (req: Request, res: Response) => {
    if (!checkRateLimit(`verify-reset:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: "Too many verification attempts" });
    }
    const parsed = verifyCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const { email, code } = parsed.data;
    
    // Verify the code
    const isValid = await storage.verifyPasswordReset(email, code);
    if (!isValid) {
      const reset = await storage.getPasswordReset(email);
      if (reset && reset.attempts >= 5) {
        await storage.deletePasswordReset(email);
        return res.status(429).json({ message: "Too many failed attempts, please request a new code" });
      }
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    
    return res.json({ message: "Code verified successfully" });
  });

  // Reset password with new password
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    if (!checkRateLimit(`reset:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many requests" });
    }
    const parsed = z.object({
      email: emailSchema,
      code: z.string().min(6).max(6),
      newPassword: strongPassword,
    }).safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const { email, code, newPassword } = parsed.data;
    
    // Verify the code again (as extra validation)
    const isValid = await storage.verifyPasswordReset(email, code);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await storage.updateUserPassword(email, hashedPassword);
    
    // Delete reset record
    await storage.deletePasswordReset(email);
    
    return res.json({ message: "Password reset successfully" });
  });

  // Current user
  app.get("/api/me", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "not found" });
    
    const isPro = user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
    
    return res.json({ 
      id: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
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

  // Upgrade to Pro (legacy simulation - kept for fallback/testing)
  app.post("/api/pro/upgrade", requireAuth, async (req: Request, res: Response) => {
    try {
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
    } catch (err: any) {
      return res.status(500).json({ message: "Upgrade failed" });
    }
  });

  // Cancel Pro subscription
  app.post("/api/pro/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
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
    } catch (err: any) {
      return res.status(500).json({ message: "Cancel failed" });
    }
  });

  // Create Stripe Checkout session
  app.post("/api/billing/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const stripe = getStripe();
      if (!stripe) return res.status(503).json({ message: "Billing not configured" });
      const userId = (req as any).userId as string;
      // Lock to USD $2 monthly price; card/bank handles FX conversion
      const price = STRIPE_PRICE_PRO_MONTHLY_USD || STRIPE_PRICE_PRO_MONTHLY;
      if (!price) return res.status(503).json({ message: "Price not configured" });
      const baseUrl = getBaseUrl(req);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        success_url: `${baseUrl}/pricing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        client_reference_id: userId,
        allow_promotion_codes: true,
        subscription_data: { metadata: { userId } },
        metadata: { userId },
        automatic_tax: { enabled: true },
      });
      return res.json({ url: session.url });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to create checkout" });
    }
  });

  // Create Stripe Billing Portal session
  app.get("/api/billing/portal", requireAuth, async (req: Request, res: Response) => {
    try {
      const stripe = getStripe();
      if (!stripe) return res.status(503).json({ message: "Billing not configured" });
      const userId = (req as any).userId as string;
      const baseUrl = getBaseUrl(req);

      // Find stored customer mapping
      const mapping = await db.select().from(stripeCustomers).where(eq(stripeCustomers.userId, userId)).limit(1);
      if (!mapping.length) return res.status(404).json({ message: "No billing customer found" });

      const portal = await stripe.billingPortal.sessions.create({
        customer: mapping[0].customerId,
        return_url: `${baseUrl}/pricing`,
      });
      return res.json({ url: portal.url });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to create portal" });
    }
  });

  // Stripe webhook (raw body is required; configured in index.ts)
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ message: "Billing not configured" });
    if (!STRIPE_WEBHOOK_SECRET) return res.status(503).json({ message: "Webhook not configured" });

    let event: Stripe.Event;
    try {
      const sig = req.headers["stripe-signature"] as string;
      const raw = (req as any).body || (req as any).rawBody;
      event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e: any) {
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }

    // Idempotency: skip if already processed
    try {
      await db.insert(webhookEvents).values({ id: event.id });
    } catch {
      return res.status(200).json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = (session.client_reference_id as string) || (session.metadata?.userId as string);
          const customerId = (session.customer as string) || "";
          if (userId && customerId) {
            // upsert mapping
            const existing = await db.select().from(stripeCustomers).where(eq(stripeCustomers.userId, userId)).limit(1);
            if (existing.length) {
              // nothing to do, or update if changed
            } else {
              await db.insert(stripeCustomers).values({ userId, customerId });
            }
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const userId = (sub.metadata?.userId as string) || undefined;
          const customerId = (sub.customer as string) || undefined;
          const status = sub.status;
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

          let targetUserId = userId;
          if (!targetUserId && customerId) {
            const map = await db.select().from(stripeCustomers).where(eq(stripeCustomers.customerId, customerId)).limit(1);
            if (map.length) targetUserId = map[0].userId;
          }

          if (targetUserId) {
            const active = status === "active" || status === "trialing";
            await db
              .update(users)
              .set({ isPro: active, proExpiresAt: active ? periodEnd : null })
              .where(eq(users.id, targetUserId));
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = (sub.customer as string) || undefined;
          if (customerId) {
            const map = await db.select().from(stripeCustomers).where(eq(stripeCustomers.customerId, customerId)).limit(1);
            if (map.length) {
              await db.update(users).set({ isPro: false, proExpiresAt: null }).where(eq(users.id, map[0].userId));
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      // swallow business errors to not get retries for non-critical paths
    }

    return res.json({ received: true });
  });

  // Debug endpoint to test Resend
  app.post("/api/debug/test-email", async (req: Request, res: Response) => {
    if (!resend) {
      return res.json({ 
        status: "no-key",
        message: "Resend API key not configured",
        apiKey: RESEND_API_KEY ? "configured" : "missing",
        fromEmail: RESEND_FROM_EMAIL
      });
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: "felypexelepe@hotmail.com",
      subject: "🧪 Teste Resend - Debug",
      html: `<h2>Email de teste do Resend</h2><p>Se você recebeu isso, Resend está funcionando!</p>`,
    });

    return res.json({
      status: error ? "error" : "success",
      error: error ? error : null,
      data: data,
      apiKeyConfigured: !!RESEND_API_KEY,
      fromEmail: RESEND_FROM_EMAIL
    });
  });

  return httpServer;
}
