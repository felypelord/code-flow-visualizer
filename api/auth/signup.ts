import { z } from "zod";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { Resend } from "resend";

const emailSchema = z.string().email("Invalid email");
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

const signupSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  country: z.string().min(1).max(100),
  password: strongPassword,
  // Pro-gating: require a token proving payment or admin invite
  proToken: z.string().min(6, "Missing pro token").max(200),
});

// Simple inline schema definitions for serverless context
const usersTable = "users";
const emailVerificationsTable = "email_verifications";

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        ok: false,
        message: "invalid signup data",
        errors: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message }))
      }));
      return;
    }

    const { email, firstName, lastName, dateOfBirth, country, password, proToken } = parsed.data;

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        ok: false,
        error: "DATABASE_URL not configured on this server"
      }));
      return;
    }

    // Initialize database connection
    const client = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    try {
      // Pro-only gating: allow only if token is valid
      let proAllowed = false;

      // 1) Check DB entitlement if table exists
      try {
        const entitlements = await client`
          SELECT id, email, token, status, used_at
          FROM pro_signup_entitlements
          WHERE token = ${proToken}
          LIMIT 1
        `;
        if (entitlements.length > 0) {
          const e = entitlements[0] as any;
          if ((e.status === 'paid' || e.status === 'granted') && !e.used_at && e.email === email) {
            proAllowed = true;
          }
        }
      } catch (_) {
        // Table might not exist yet; fall back to env code check below
      }

      // 2) Fallback: allow with admin env code
      if (!proAllowed && process.env.PRO_SIGNUP_CODE && proToken === process.env.PRO_SIGNUP_CODE) {
        proAllowed = true;
      }

      if (!proAllowed) {
        res.statusCode = 402;
        res.end(JSON.stringify({
          ok: false,
          message: "Pro required to create an account. Please purchase a plan.",
        }));
        await client.end();
        return;
      }
      // Check if user already exists
      const existingUsers = await client`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `;
      
      if (existingUsers.length > 0) {
        res.statusCode = 409;
        res.end(JSON.stringify({
          ok: false,
          message: "Email already registered"
        }));
        await client.end();
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with Pro access (since they passed pro-gating)
      await client`
        INSERT INTO users (email, password, first_name, last_name, date_of_birth, country, email_verified, is_pro) 
        VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${new Date(dateOfBirth)}, ${country}, false, true)
      `;

      // If entitlement exists, mark as used
      try {
        await client`
          UPDATE pro_signup_entitlements
          SET used_at = NOW()
          WHERE token = ${proToken} AND email = ${email} AND used_at IS NULL
        `;
      } catch (_) {}

      // Generate verification code
      const verificationCode = Math.random().toString().slice(2, 8);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await client`
        INSERT INTO email_verifications (email, code, expires_at, attempts) 
        VALUES (${email}, ${verificationCode}, ${expiresAt}, 0) 
        ON CONFLICT (email) 
        DO UPDATE SET code = ${verificationCode}, expires_at = ${expiresAt}, attempts = 0
      `;

      // Send verification email via Resend (WAIT for response)
      let emailSent = false;
      let emailError = null;
      
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@codeflowbr.site";
          
          const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: "Verify your Code Flow account",
            html: `<p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code expires in 15 minutes.</p>`,
          });
          
          if (error) {
            console.error("[ERROR] Resend error:", error);
            emailError = error.message;
          } else {
            console.log("[SUCCESS] Email sent:", data);
            emailSent = true;
          }
        } catch (err) {
          console.error("[ERROR] Failed to send verification email:", err);
          emailError = err instanceof Error ? err.message : String(err);
        }
      } else {
        emailError = "RESEND_API_KEY not configured";
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        ok: true,
        message: "User created! Check your email for the verification code.",
        email
      }));
    } finally {
      await client.end();
    }
  } catch (err: any) {
    console.error("[ERROR] /api/auth/signup exception:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }));
  }
}
