import { z } from "zod";
import * as bcrypt from "bcryptjs";
import postgres from "postgres";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  newPassword: z.string().min(8),
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
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        ok: false,
        message: "invalid reset password data",
        errors: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message }))
      }));
      return;
    }

    const { email, code, newPassword } = parsed.data;

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

    // Find password reset record
    const reset = await client`SELECT * FROM password_resets WHERE email = ${email} LIMIT 1`;

    if (reset.length === 0) {
      res.statusCode = 404;
      res.end(JSON.stringify({
        ok: false,
        message: "No password reset request found for this email"
      }));
      await client.end();
      return;
    }

    const record = reset[0];

    // Check if expired
    if (new Date() > new Date(record.expires_at)) {
      res.statusCode = 410;
      res.end(JSON.stringify({
        ok: false,
        message: "Password reset code expired. Request a new one."
      }));
      await client.end();
      return;
    }

    // Check attempts
    if (record.attempts >= 5) {
      res.statusCode = 429;
      res.end(JSON.stringify({
        ok: false,
        message: "Too many failed attempts. Request a new reset code."
      }));
      await client.end();
      return;
    }

    // Check code
    if (record.code !== code) {
      await client`UPDATE password_resets SET attempts = attempts + 1 WHERE email = ${email}`;

      res.statusCode = 400;
      res.end(JSON.stringify({
        ok: false,
        message: "Invalid reset code"
      }));
      await client.end();
      return;
    }

    // Code is valid! Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await client`UPDATE users SET password = ${hashedPassword} WHERE email = ${email}`;

    // Clean up reset record
    await client`DELETE FROM password_resets WHERE email = ${email}`;

    await client.end();

    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      message: "Password reset successfully! You can now log in with your new password."
    }));
  } catch (err: any) {
    console.error("[ERROR] /api/auth/reset-password exception:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }));
  }
}
