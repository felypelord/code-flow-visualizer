import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import { sql } from "drizzle-orm";

const dbUrl = process.env.DATABASE_URL;

// Require DATABASE_URL in production; allow a local default for development
if (process.env.NODE_ENV === 'production' && !dbUrl) {
  console.error('[FATAL] DATABASE_URL not set in production environment');
  throw new Error('Missing DATABASE_URL in production');
}

// Avoid embedding credentials in source; fall back to a localhost URL without credentials for local dev
const finalUrl = dbUrl || "postgresql://localhost:5432/codeflow";
const useSsl = process.env.PGSSL === "true" || process.env.NODE_ENV === "production";
const client = postgres(finalUrl, {
  ...(useSsl ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" } } : {}),
  connect_timeout: 30,
  idle_timeout: 60,
  max_lifetime: 60 * 60,
  max: 50,
  debug: (con, query, params, types) => {
    // Log slow queries (> 500ms) in production
    if (process.env.NODE_ENV === 'production') {
      const start = Date.now();
      return {
        start,
        query: (err: unknown) => {
          const duration = Date.now() - start;
          if (duration > 500) {
            console.log(`[SLOW_QUERY] ${duration}ms - ${query.substring(0, 100)}`);
          }
        }
      };
    }
  },
});

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };

// Best-effort ensure auxiliary tables exist (idempotent)
async function ensureAuxTables() {
  try {
    await db.execute(sql`alter table users add column if not exists username_color text`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists featured_until timestamp`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists equipped_badge text`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists particle_effects boolean default false`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists trophy_case text`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists custom_theme text`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists custom_watermark boolean default false`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists watermark_text text`);
  } catch {}
  try {
    await db.execute(sql`alter table users add column if not exists frame_animation text`);
  } catch {}
  try {
    await db.execute(sql`create table if not exists webhook_events (
      id text primary key,
      created_at timestamp default now()
    )`);
  } catch {}
  try {
    await db.execute(sql`create table if not exists roadmap_progress (
      id varchar primary key default gen_random_uuid(),
      user_id varchar not null references users(id) on delete cascade,
      path_id text not null,
      item_slug text not null,
      status text not null default 'completed',
      progress_meta text,
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
