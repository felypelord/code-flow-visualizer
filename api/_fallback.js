const Buffer = require('buffer').Buffer;

function makeFallbackToken(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64'); }

function parseFallbackTokenFromReq(req) {
  const hdr = req.headers && (req.headers.authorization || req.headers.Authorization || req.headers.Auth);
  let token = null;
  if (hdr && String(hdr).startsWith('Bearer ')) token = String(hdr).slice(7).trim();
  if (!token && req.query && req.query.token) token = req.query.token;
  if (!token) return null;
  try { const raw = Buffer.from(String(token), 'base64').toString('utf8'); return JSON.parse(raw); } catch (e) {
    try { const raw = Buffer.from(String(token), 'base64').toString('utf8'); const parts = raw.split(':'); return { id: parts[0], email: parts.slice(1).join(':'), pro: false, coins: 0 }; } catch (e2) { return null; }
  }
}

const STORE_CATALOG_FALLBACK = [
  { id: 'avatar_ninja', name: 'Ninja Avatar', description: 'Stealthy and cool', type: 'cosmetic', price: 50 },
  { id: 'avatar_robot', name: 'Robot Avatar', description: 'Beep boop', type: 'cosmetic', price: 50 },
  { id: 'flowcoins_100', name: '100 FlowCoins', description: 'In-app currency', type: 'currency', price: 199 }
];

module.exports = { makeFallbackToken, parseFallbackTokenFromReq, STORE_CATALOG_FALLBACK };
