#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: './tmp/.env' });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

async function main(){
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try{
    const res = await client.query("SELECT id FROM __drizzle_migrations WHERE id LIKE '%.sql'");
    for (const row of res.rows){
      const idWithExt = row.id;
      const base = idWithExt.replace(/\.sql$/i, '');
      const exists = await client.query('SELECT id FROM __drizzle_migrations WHERE id=$1', [base]);
      if (exists.rows.length>0){
        // base exists, delete the .sql record
        await client.query('DELETE FROM __drizzle_migrations WHERE id=$1', [idWithExt]);
        console.log('deleted duplicate:', idWithExt);
      } else {
        // rename
        await client.query('UPDATE __drizzle_migrations SET id=$1 WHERE id=$2', [base, idWithExt]);
        console.log('renamed', idWithExt, '->', base);
      }
    }
  } catch(e){
    console.error('Error:', e);
    process.exitCode=2;
  } finally{
    await client.end();
  }
}

main();
