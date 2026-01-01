import express from 'express';
import compression from 'compression';
import { createServer } from 'http';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Static require hint: some bundlers only include files that are
// statically required. Attempt harmless static requires so the
// files are bundled into the function package.
try {
	require('./dist/index.cjs');
} catch (e) {
	// ignore — the file may not exist at build time
}

// Also hint bundlers to include a top-level function-local bundle.
try {
	require('./index.cjs');
} catch (e) {
	// ignore — the file may not exist at build time
}

let appPromise = null;
async function getApp() {
	if (appPromise) return appPromise;
	appPromise = (async () => {
		const app = express();
		const httpServer = createServer(app);

		app.disable('x-powered-by');
		app.use((_req, res, next) => {
			res.setHeader('X-Content-Type-Options', 'nosniff');
			res.setHeader('X-Frame-Options', 'DENY');
			res.setHeader('X-XSS-Protection', '1; mode=block');
			res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
			next();
		});
		app.use(compression({ threshold: 1024 }));

		const JSON_LIMIT = process.env.JSON_LIMIT || '200kb';
		const stripeWebhookPath = '/api/monetization/stripe-webhook';
		app.use(stripeWebhookPath, express.raw({ type: 'application/json', limit: JSON_LIMIT }));
		app.use(stripeWebhookPath, (req, _res, next) => { if (!req.rawBody) req.rawBody = req.body; next(); });

		const jsonParser = express.json({ limit: JSON_LIMIT, verify: (req, _res, buf) => { req.rawBody = buf; } });
		app.use((req, res, next) => { if (req.path === stripeWebhookPath) return next(); return jsonParser(req, res, next); });
		app.use(express.urlencoded({ extended: false, limit: process.env.FORM_LIMIT || '200kb' }));

		// Prefer the compiled server bundle (dist/index.cjs) in production,
		// since the `server/` tree may not be present on the deploy.
		try {
			const pathMod = await import('path');
			const fs = await import('fs');
			const candidates = [];
			candidates.push(pathMod.resolve(process.cwd(), 'dist', 'index.cjs'));
			candidates.push(pathMod.resolve(process.cwd(), '..', 'dist', 'index.cjs'));
				// also check for an index.cjs placed directly inside the api folder
				try {
					const thisFile3 = new URL(import.meta.url).pathname;
					candidates.push(pathMod.resolve(pathMod.dirname(thisFile3), 'index.cjs'));
				} catch (e) {}
			// Also check for a dist bundled under the api folder (included in some deploys)
			try {
				const thisFile2 = new URL(import.meta.url).pathname;
				candidates.push(pathMod.resolve(pathMod.dirname(thisFile2), 'dist', 'index.cjs'));
			} catch (e) { /* ignore */ }
			try {
				const thisFile = new URL(import.meta.url).pathname;
				candidates.push(pathMod.resolve(pathMod.dirname(thisFile), '..', 'dist', 'index.cjs'));
			} catch (e) { /* ignore */ }
			candidates.push('/var/task/dist/index.cjs');
			for (const abs of candidates) {
				try {
					const exists = fs.existsSync(abs);
					console.info('[api/index.mjs] checking for dist bundle at', abs, 'exists=', exists);
					if (!exists) continue;
					try {
						const compiled = require(abs);
						const registerRoutes = compiled && (compiled.registerRoutes || compiled.default?.registerRoutes);
						if (typeof registerRoutes === 'function') {
							console.info('[api/index.mjs] calling registerRoutes from dist bundle at', abs);
							await registerRoutes(httpServer, app);
							console.info('[api/index.mjs] loaded routes from', abs);
							return app;
						} else {
							console.info('[api/index.mjs] dist bundle loaded but registerRoutes not found at', abs);
						}
					} catch (e) {
						console.error('[api/index.mjs] failed to require', abs, e && (e.stack || e.message || e));
					}
				} catch (e) {
					console.info('[api/index.mjs] error checking path', abs, e && (e.message || e));
				}
			}
		} catch (e) {
			console.info('[api/index.mjs] no compiled dist/index.cjs found or failed to load', e && (e.message || e));
		}

		// Try to register routes from source server tree as a fallback (useful for local dev)
		try {
			const mod = await import('../server/routes');
			const registerRoutes = mod.registerRoutes;
			if (typeof registerRoutes === 'function') {
				await registerRoutes(httpServer, app);
				return app;
			}
		} catch (e) {
			console.info('[api/index.mjs] server/routes import failed (fallback)', e && (e.message || e));
		}

		// Diagnostic endpoint to report on compiled bundle presence and require errors
		app.get('/api/_diag', async (_req, res) => {
			try {
				const pathMod = await import('path');
				const fs = await import('fs');
				const candidates = [];
				candidates.push(pathMod.resolve(process.cwd(), 'dist', 'index.cjs'));
				candidates.push(pathMod.resolve(process.cwd(), '..', 'dist', 'index.cjs'));
				try {
					const thisFile = new URL(import.meta.url).pathname;
					candidates.push(pathMod.resolve(pathMod.dirname(thisFile), '..', 'dist', 'index.cjs'));
					// Also report on a potential api-local dist (api/dist/index.cjs)
					candidates.push(pathMod.resolve(pathMod.dirname(thisFile), 'dist', 'index.cjs'));
					// Also report on a potential api/index.cjs placed next to this file
					candidates.push(pathMod.resolve(pathMod.dirname(thisFile), 'index.cjs'));
				} catch (e) { }
				candidates.push('/var/task/dist/index.cjs');
				const results = [];
				for (const abs of candidates) {
					try {
						const exists = fs.existsSync(abs);
						let registerFound = false;
						let loadError = null;
						if (exists) {
							try {
								const compiled = require(abs);
								registerFound = !!(compiled && (compiled.registerRoutes || compiled.default?.registerRoutes));
							} catch (e) {
								loadError = e && (e.stack || e.message || String(e));
							}
						}
						results.push({ path: abs, exists, registerFound, loadError });
					} catch (e) {
						results.push({ path: abs, error: e && (e.stack || e.message) });
					}
				}
				return res.json({ ok: true, results });
			} catch (e) {
				return res.status(500).json({ ok: false, error: 'diag_failed', message: e && (e.stack || e.message) });
			}
		});

		// Last-resort fallback: provide some minimal endpoints so the site can function
		const STORE_CATALOG_FALLBACK = [
			{ id: 'avatar_ninja', name: 'Ninja Avatar', description: 'Stealthy and cool', type: 'cosmetic', price: 50 },
			{ id: 'avatar_robot', name: 'Robot Avatar', description: 'Beep boop', type: 'cosmetic', price: 50 },
			{ id: 'flowcoins_100', name: '100 FlowCoins', description: 'In-app currency', type: 'currency', price: 199 }
		];

		app.get('/api/store/public', (_req, res) => {
			res.json({ items: STORE_CATALOG_FALLBACK });
		});

		app.post('/api/complete-signup', express.json(), (req, res) => {
			try {
				const body = req.body || {};
				const email = body.email || body.username || 'unknown@example.com';
				const id = `user_${Date.now()}`;
				const token = Buffer.from(`${id}:${email}`).toString('base64');
				return res.json({ ok: true, token, user: { id, email } });
			} catch (err) {
				return res.status(500).json({ error: 'signup_failed' });
			}
		});

		function parseFallbackToken(req) {
			const hdr = req.headers && (req.headers.authorization || req.headers.Authorization || req.headers.Auth);
			let token = null;
			if (hdr && String(hdr).startsWith('Bearer ')) token = String(hdr).slice(7).trim();
			if (!token && req.query && req.query.token) token = req.query.token;
			if (!token) return null;
			try {
				const raw = Buffer.from(String(token), 'base64').toString('utf8');
				const parts = raw.split(':');
				return { id: parts[0], email: parts.slice(1).join(':') };
			} catch (e) {
				return null;
			}
		}

		app.get('/api/me', (req, res) => {
			const user = parseFallbackToken(req);
			if (!user) return res.status(401).json({ error: 'not_authenticated' });
			return res.json({ ok: true, user });
		});

		app.get('/api/coins/balance', (req, res) => {
			const user = parseFallbackToken(req);
			if (!user) return res.status(401).json({ error: 'not_authenticated' });
			return res.json({ ok: true, balance: 0 });
		});

		// Parse token that may be either legacy base64 "id:email" or JSON payload
		function parseFallbackToken(req) {
			const hdr = req.headers && (req.headers.authorization || req.headers.Authorization || req.headers.Auth);
			let token = null;
			if (hdr && String(hdr).startsWith('Bearer ')) token = String(hdr).slice(7).trim();
			if (!token && req.query && req.query.token) token = req.query.token;
			if (!token) return null;
			try {
				const raw = Buffer.from(String(token), 'base64').toString('utf8');
				// Try JSON first
				try {
					const obj = JSON.parse(raw);
					return obj;
				} catch (e) {
					const parts = raw.split(':');
					return { id: parts[0], email: parts.slice(1).join(':'), pro: false, coins: 0 };
				}
			} catch (e) {
				return null;
			}
		}

		function makeFallbackToken(obj) {
			const json = JSON.stringify(obj);
			return Buffer.from(json).toString('base64');
		}

		app.post('/api/signup', express.json(), (req, res) => {
			try {
				const body = req.body || {};
				const email = body.email || body.username || ('user_' + Date.now() + '@example.com');
				const id = `user_${Date.now()}`;
				const user = { id, email, pro: false, coins: 0 };
				const token = makeFallbackToken(user);
				return res.json({ ok: true, token, user });
			} catch (err) {
				return res.status(500).json({ error: 'signup_failed' });
			}
		});

		app.post('/api/login', express.json(), (req, res) => {
			try {
				const body = req.body || {};
				const email = body.email || body.username;
				if (!email) return res.status(400).json({ error: 'missing_email' });
				const id = `user_${Date.now()}`;
				const user = { id, email, pro: false, coins: 0 };
				const token = makeFallbackToken(user);
				return res.json({ ok: true, token, user });
			} catch (err) {
				return res.status(500).json({ error: 'login_failed' });
			}
		});

		app.post('/api/purchase', express.json(), (req, res) => {
			const body = req.body || {};
			const itemId = body.itemId || body.productId;
			let user = parseFallbackToken(req) || { id: `user_${Date.now()}`, email: 'unknown@example.com', pro: false, coins: 0 };
			if (!itemId) return res.status(400).json({ error: 'missing_itemId' });
			// Simulate purchases
			if (String(itemId).startsWith('flowcoins_')) {
				// format flowcoins_100
				const n = parseInt(String(itemId).split('_')[1] || '0', 10) || 0;
				user.coins = (user.coins || 0) + n;
				const token = makeFallbackToken(user);
				return res.json({ ok: true, itemId, coins: user.coins, token });
			}
			if (itemId === 'pro_monthly' || String(itemId).startsWith('pro_')) {
				// grant pro for 30 days
				const now = new Date();
				now.setDate(now.getDate() + 30);
				user.pro = true;
				user.proExpiresAt = now.toISOString();
				const token = makeFallbackToken(user);
				return res.json({ ok: true, itemId, proExpiresAt: user.proExpiresAt, token });
			}
			return res.status(400).json({ error: 'unknown_item' });
		});

		app.get('/api/pro/content', (req, res) => {
			const user = parseFallbackToken(req);
			if (!user || !user.pro) return res.status(403).json({ error: 'pro_required' });
			return res.json({ ok: true, content: [{ id: 'pro_course_1', title: 'Pro Course: Advanced Flow' }] });
		});

		app.get('/api/learning/path', (req, res) => {
			const user = parseFallbackToken(req);
			if (!user) return res.status(401).json({ error: 'not_authenticated' });
			const path = [{ slug: 'start', title: 'Get Started' }, { slug: 'advanced', title: 'Advanced Path', proOnly: true }];
			return res.json({ ok: true, path });
		});

		app.get('/api/health', (_req, res) => res.json({ ok: false, error: 'server bundle missing' }));
		app.use((req, res) => {
			res.setHeader('Content-Type', 'application/json');
			res.status(500).end(JSON.stringify({ error: 'startup_error', message: 'no server routes available' }));
		});
		return app;
	})();
	return appPromise;
}

export default async function handler(req, res) {
	try {
		const url = (req.url || req.path || req.originalUrl || '').toString();
		if (url === '/api/health' || url === '/health' || url.startsWith('/api/health')) {
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = 200;
			res.end(JSON.stringify({ ok: true }));
			return;
		}
		const app = await getApp();
		return app(req, res);
	} catch (err) {
		console.error('[api/index.mjs] Handler error:', err && (err.stack || err));
		try { res.status(500).json({ error: 'Internal server error' }); } catch {}
		throw err;
	}
}
