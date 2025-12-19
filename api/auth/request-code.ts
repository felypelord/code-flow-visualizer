import { z } from "zod";
import postgres from "postgres";
import { Resend } from "resend";

const emailSchema = z.string().email();

// Simple rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || record.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: "POST only" }));
    return;
  }

  try {
    // Rate limit: 3 requests per 60 seconds per IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    if (!checkRateLimit(`code:${clientIp}`, 3, 60_000)) {
      res.statusCode = 429;
      res.end(JSON.stringify({ ok: false, error: "too many requests" }));
      return;
    }
    
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const parsed = emailSchema.safeParse(body.email);
    if (!parsed.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "invalid email" }));
      return;
    }

    if (!process.env.DATABASE_URL) {
      res.statusCode = 503;
      res.end(JSON.stringify({ ok: false, error: "DATABASE_URL not configured" }));
      return;
    }

    const client = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    const email = parsed.data;
    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await client`
      INSERT INTO email_verifications (email, code, expires_at, attempts)
      VALUES (${email}, ${code}, ${expiresAt}, 0)
      ON CONFLICT (email)
      DO UPDATE SET code = ${code}, expires_at = ${expiresAt}, attempts = 0
    `;

    let emailError: string | null = null;
    let emailSent = false;
    try {
      if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@codeflowbr.site";
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "Your verification code",
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
      });
      if (error) throw new Error(error.message);
      emailSent = true;
    } catch (err: any) {
      emailError = err?.message || String(err);
    }

    await client.end();

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, email, emailSent, emailError }));
  } catch (err: any) {
    console.error("[ERROR] /api/auth/request-code:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}
