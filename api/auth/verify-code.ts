import { z } from "zod";
import postgres from "postgres";

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = verifyCodeSchema.safeParse(body);

    if (!parsed.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        ok: false,
        message: "invalid verification data",
        errors: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message }))
      }));
      return;
    }

    const { email, code } = parsed.data;

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        ok: false,
        error: "DATABASE_URL not configured"
      }));
      return;
    }

    const client = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    // Find verification record
    const verification = await client`SELECT * FROM email_verifications WHERE email = ${email} LIMIT 1`;

    if (verification.length === 0) {
      res.statusCode = 404;
      res.end(JSON.stringify({
        ok: false,
        message: "No verification request found for this email"
      }));
      await client.end();
      return;
    }

    const record = verification[0];

    // Check if expired
    if (new Date() > new Date(record.expires_at)) {
      res.statusCode = 410;
      res.end(JSON.stringify({
        ok: false,
        message: "Verification code expired"
      }));
      await client.end();
      return;
    }

    // Check attempts
    if (record.attempts >= 5) {
      res.statusCode = 429;
      res.end(JSON.stringify({
        ok: false,
        message: "Too many failed attempts. Request a new code."
      }));
      await client.end();
      return;
    }

    // Check code
    if (record.code !== code) {
      // Increment attempts
      await client`UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ${email}`;

      res.statusCode = 400;
      res.end(JSON.stringify({
        ok: false,
        message: "Invalid verification code"
      }));
      await client.end();
      return;
    }

    // Code is valid! Mark user as verified
    await client`UPDATE users SET email_verified = true WHERE email = ${email}`;

    // Clean up verification record
    await client`DELETE FROM email_verifications WHERE email = ${email}`;

    await client.end();

    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      message: "Email verified successfully! You can now log in.",
      email
    }));
  } catch (err: any) {
    console.error("[ERROR] /api/auth/verify-code exception:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }));
  }
}

    }));
