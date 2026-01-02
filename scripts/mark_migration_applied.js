#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: './tmp/.env' });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const id = process.argv[2] || '0001_initial_schema';
const name = process.argv[3] || 'initial_schema';

async function main(){
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try{
    await client.query(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (id TEXT PRIMARY KEY, name TEXT, hash TEXT, run_at TIMESTAMPTZ DEFAULT now())`);
    const res = await client.query('SELECT id FROM __drizzle_migrations WHERE id=$1', [id]);
    if (res.rows.length>0){
      console.log('Migration already recorded:', id);
    } else {
      await client.query('INSERT INTO __drizzle_migrations(id,name,hash) VALUES($1,$2,$3)', [id,name,'']);
      console.log('Inserted migration record:', id);
    }
  } catch(e){
    console.error('Error:', e);
    process.exitCode=2;
  } finally{
    await client.end();
  }
}

main();
