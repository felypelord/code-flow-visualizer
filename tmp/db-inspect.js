import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

(async ()=>{
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    console.log('connected');
    const tablesRes = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    console.log('tables:');
    console.log(tablesRes.rows.map(r=>r.tablename).join('\n'));

    // Check for drizzle migrations table
    const mgRes = await client.query("SELECT to_regclass('__drizzle_migrations') as exists");
    console.log('__drizzle_migrations exists:', mgRes.rows[0].exists !== null);
    if (mgRes.rows[0].exists) {
      const applied = await client.query('SELECT * FROM __drizzle_migrations ORDER BY id LIMIT 50');
      console.log('applied migrations (sample up to 50 rows):');
      console.log(applied.rows.slice(0,50));
    }

    // check for progress table
    const prog = await client.query("SELECT to_regclass('progress') as exists");
    console.log('progress table exists:', prog.rows[0].exists !== null);

    await client.end();
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e && (e.stack || e.message || e));
    try { await client.end(); } catch {}
    process.exit(3);
  }
})();
