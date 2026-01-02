#!/usr/bin/env node

/**
 * Add FlowCoins to Test Account
 * 
 * Usage:
 *   node add-coins.mjs 10000
 * 
 * Or set DATABASE_URL env var first:
 *   DATABASE_URL="postgresql://..." node add-coins.mjs 10000
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  console.error('   Set it in your .env.local or pass it as env var');
  process.exit(1);
}

const amount = parseInt(process.argv[2], 10) || 10000;
const userId = '29e0e0a8-cf18-4a08-9050-fbab166ff51e';
const userEmail = 'felypexelepe@hotmail.com';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon
});

async function addCoins() {
  const client = await pool.connect();
  
  try {
    console.log(`\n💰 Adding ${amount} FlowCoins to ${userEmail}...\n`);
    
    // Get current balance
    const before = await client.query(
      'SELECT id, email, coins FROM users WHERE id = $1',
      [userId]
    );
    
    if (before.rows.length === 0) {
      console.error('❌ User not found');
      process.exit(1);
    }
    
    const oldBalance = before.rows[0].coins || 0;
    console.log(`📊 Previous balance: ${oldBalance} coins`);
    
    // Update coins
    await client.query(
      'UPDATE users SET coins = coins + $1 WHERE id = $2',
      [amount, userId]
    );
    
    // Get new balance
    const after = await client.query(
      'SELECT id, email, coins FROM users WHERE id = $1',
      [userId]
    );
    
    const newBalance = after.rows[0].coins;
    console.log(`✅ New balance: ${newBalance} coins`);
    console.log(`📈 Added: +${amount} coins\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

addCoins();
