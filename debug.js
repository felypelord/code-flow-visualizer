// Debug script to catch startup errors
require('dotenv').config();

console.log('[DEBUG] Starting server with env:', {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'MISSING',
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
});

require('tsx').cjs.default('./server/index.ts').catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
