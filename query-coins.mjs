#!/usr/bin/env node

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findAndAddCoins() {
  const client = await pool.connect();
  
  try {
    // First, find the user
    const users = await client.query(
      "SELECT id, email, coins FROM users WHERE email = 'felypexelepe@hotmail.com'"
    );
    
    if (users.rows.length === 0) {
      console.log('❌ User not found');
      // List all users to debug
      const allUsers = await client.query('SELECT id, email, coins FROM users LIMIT 5');
      console.log('\nAvailable users (first 5):');
      allUsers.rows.forEach(u => console.log(`  ${u.email} (${u.id}): ${u.coins} coins`));
      process.exit(1);
    }
    
    const user = users.rows[0];
    console.log(`\n✅ Found user: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Current balance: ${user.coins || 0} coins`);
    
    // Update coins
    await client.query(
      'UPDATE users SET coins = coins + 10000 WHERE id = $1',
      [user.id]
    );
    
    // Verify
    const updated = await client.query(
      'SELECT coins FROM users WHERE id = $1',
      [user.id]
    );
    
    console.log(`   New balance: ${updated.rows[0].coins} coins`);
    console.log(`\n💰 Successfully added 10,000 FlowCoins!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.release();
    await pool.end();
  }
}

findAndAddCoins();
