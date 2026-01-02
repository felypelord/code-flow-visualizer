#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: './tmp/.env' });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), 'migrations');

async function main(){
  const files = fs.readdirSync(migrationsDir).filter(f=>!f.startsWith('meta') && !f.endsWith('.map'));
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try{
    await client.query(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (id TEXT PRIMARY KEY, name TEXT, hash TEXT, run_at TIMESTAMPTZ DEFAULT now())`);
    for (const f of files){
      const id = f.replace(/\.sql$/i,'');
      const name = id;
      const res = await client.query('SELECT id FROM __drizzle_migrations WHERE id=$1', [id]);
      if (res.rows.length>0){
        console.log('already recorded:', id);
        continue;
      }
      await client.query('INSERT INTO __drizzle_migrations(id,name,hash) VALUES($1,$2,$3)', [id, name, '']);
      console.log('inserted:', id);
    }
  } catch(e){
    console.error('Error:', e);
    process.exitCode=2;
  } finally{
    await client.end();
  }
}

main();
