import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.NODE_ENV !== "development") {
  throw new Error("DATABASE_URL must be set in production");
}

const finalUrl = dbUrl || "postgresql://postgres:felype.BARRETO10@localhost:5432/codeflow";
const useSsl = process.env.PGSSL === "true" || process.env.NODE_ENV === "production";
const client = postgres(finalUrl, {
  ...(useSsl ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" } } : {}),
  connect_timeout: 10,
  idle_timeout: 30,
  max_lifetime: 60 * 30,
  max_pool_size: 20,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };

// Best-effort ensure auxiliary tables exist (idempotent)
async function ensureAuxTables() {
  try {
    await db.execute(sql`create table if not exists webhook_events (
      id text primary key,
      created_at timestamp default now()
    )`);
  } catch {}
  try {
    await db.execute(sql`create table if not exists stripe_customers (
      user_id varchar(255) primary key references users(id) on delete cascade,
      customer_id text not null unique,
      created_at timestamp default now()
    )`);
  } catch {}
}

// Fire and forget
ensureAuxTables().catch(() => {});
