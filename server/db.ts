import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("⚠ DATABASE_URL not set - DB features will fail");
  // Fallback to localhost for dev
  const fallback = "postgresql://postgres:postgres@localhost:5432/codeflow";
  console.warn(`  Using fallback: ${fallback}`);
}

const finalUrl = dbUrl || "postgresql://postgres:postgres@localhost:5432/codeflow";
const useSsl = process.env.PGSSL === "true" || process.env.NODE_ENV === "production";
const client = postgres(finalUrl, useSsl ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" } } : {});

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };
