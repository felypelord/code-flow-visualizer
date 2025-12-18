import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
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
});

// Simple inline schema definitions for serverless context
const usersTable = "users";
const emailVerificationsTable = "email_verifications";

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(400).end(JSON.stringify({ error: "POST only" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      res.status(400).end(JSON.stringify({
        ok: false,
        message: "invalid signup data",
        errors: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message }))
      }));
      return;
    }

    const { email, firstName, lastName, dateOfBirth, country, password } = parsed.data;

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      res.status(500).end(JSON.stringify({
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
      // Just return ok for now, test database connection first
      res.status(200).end(JSON.stringify({
        ok: true,
        message: "Signup endpoint is responding",
        debug: {
          email,
          hasDatabase: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      }));
    } finally {
      // Don't try to connect to DB yet
    }
  } catch (err: any) {
    console.error("[ERROR] /api/auth/signup exception:", err);
    res.status(500).end(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }));
  }
}
