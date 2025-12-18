import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.NODE_ENV !== "development") {
  throw new Error("DATABASE_URL must be set in production");
}

const finalUrl = dbUrl || "postgresql://postgres:felype.BARRETO10@localhost:5432/codeflow";
const useSsl = process.env.PGSSL === "true" || process.env.NODE_ENV === "production";
const client = postgres(finalUrl, useSsl ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" } } : {});

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };
