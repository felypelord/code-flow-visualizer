#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load tmp/.env if present, otherwise rely on environment
dotenv.config({ path: './tmp/.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Set it in env or tmp/.env');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    console.log('Connected to DB. Creating __drizzle_migrations if missing...');

    // Create table if not exists
    await client.query(
      `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id TEXT PRIMARY KEY,
        name TEXT,
        hash TEXT,
        run_at TIMESTAMPTZ DEFAULT now()
      )`
    );

    const res = await client.query('SELECT count(*)::int AS cnt FROM __drizzle_migrations');
    const count = res.rows[0].cnt;
    if (count > 0) {
      console.log('__drizzle_migrations already has', count, 'row(s). No baseline inserted.');
    } else {
      const baselineId = 'baseline_' + Date.now();
      await client.query('INSERT INTO __drizzle_migrations(id,name,hash) VALUES($1,$2,$3)', [
        baselineId,
        'baseline',
        ''
      ]);
      console.log('Inserted baseline row with id', baselineId);
    }

    console.log('Done. You can now re-run `npm run db:migrate` (drizzle-kit migrate).');
  } catch (err) {
    console.error('Error during baseline creation:', err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

main();
