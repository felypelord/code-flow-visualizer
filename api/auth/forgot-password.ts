import { z } from "zod";
import postgres from "postgres";
import { Resend } from "resend";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
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
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        ok: false,
        message: "invalid forgot password data",
        errors: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message }))
      }));
      return;
    }

    const { email } = parsed.data;

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

    // Check if user exists
    const user = await client`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    
    if (user.length === 0) {
      // Don't reveal if email exists (security)
      res.statusCode = 200;
      res.end(JSON.stringify({
        ok: true,
        message: "If this email is registered, a reset code will be sent"
      }));
      await client.end();
      return;
    }

    // Generate reset code
    const resetCode = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await client`
      INSERT INTO password_resets (email, code, expires_at, attempts) 
      VALUES (${email}, ${resetCode}, ${expiresAt}, 0)
      ON CONFLICT (email) DO UPDATE SET code = ${resetCode}, expires_at = ${expiresAt}, attempts = 0
    `;

    // Send reset email via Resend (WAIT for response)
    let emailSent = false;
    let emailError = null;
    
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@codeflowbr.site";
        
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: "Reset your Code Flow password",
          html: `<p>Your password reset code is: <strong>${resetCode}</strong></p><p>This code expires in 30 minutes.</p>`,
        });
        
        if (error) {
          console.error("[ERROR] Resend error:", error);
          emailError = error.message;
        } else {
          console.log("[SUCCESS] Password reset email sent:", data);
          emailSent = true;
        }
      } catch (err) {
        console.error("[ERROR] Failed to send password reset email:", err);
        emailError = err instanceof Error ? err.message : String(err);
      }
    } else {
      emailError = "RESEND_API_KEY not configured";
    }

    await client.end();

    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      message: "If this email is registered, a reset code will be sent",
      // DEBUG INFO (remover em produção)
      debug: {
        emailSent,
        emailError,
        resetCode // TEMPORÁRIO: mostrar código na resposta
      }
    }));
  } catch (err: any) {
    console.error("[ERROR] /api/auth/forgot-password exception:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }));
  }
}
