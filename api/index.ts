// @ts-nocheck
import express from 'express';
import compression from 'compression';
import { createServer } from 'http';

// Create and reuse the Express app across invocations to reduce cold starts
let appPromise: Promise<any> | null = null;
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
    app.use(stripeWebhookPath, (req: any, _res, next) => {
      if (!req.rawBody) req.rawBody = req.body;
      next();
    });

    const jsonParser = express.json({
      limit: JSON_LIMIT,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    });
    app.use((req, res, next) => {
      if (req.path === stripeWebhookPath) return next();
      return (jsonParser as any)(req, res, next);
    });

    app.use(express.urlencoded({ extended: false, limit: process.env.FORM_LIMIT || '200kb' }));

    // Register application routes (lazy import to avoid heavy module loads on health checks)
    try {
      const mod = await import('../server/routes');
      const registerRoutes = mod.registerRoutes;
      await registerRoutes(httpServer as any, app as any);
    } catch (err: any) {
      console.error('[api/index] Failed to import/register routes:', err && (err.stack || err.message || err));

      // Try to load the compiled server bundle (created by `npm run build`) if present.
      // On some deploys the TypeScript `server/` tree isn't shipped, but a built `dist/index.cjs`
      // may exist. Attempt to import it before falling back to api/* handlers.
      try {
        const compiled = await import('../dist/index.cjs');
        const registerRoutes = compiled && (compiled.registerRoutes || compiled.default?.registerRoutes);
        if (typeof registerRoutes === 'function') {
          await registerRoutes(httpServer as any, app as any);
          return app;
        }
      } catch (e) {
        // Try requiring the compiled CommonJS bundle as a fallback (handles CJS/Esm interop on some deploy targets)
        try {
          const { createRequire } = await import('module');
          const req = createRequire(import.meta.url);
          const compiledCjs = req('../dist/index.cjs');
          const registerRoutes = compiledCjs && (compiledCjs.registerRoutes || compiledCjs.default?.registerRoutes);
          if (typeof registerRoutes === 'function') {
            await registerRoutes(httpServer as any, app as any);
            return app;
          }
        } catch (e2) {
          // ignore
          console.info('[api/index] no compiled `dist/index.cjs` found or failed to load (cjs require):', e2 && (e2.message || e2));
        }

        // ignore - we'll continue to fallback handlers below
        console.info('[api/index] no compiled `dist/index.cjs` found or failed to load (import):', e && (e.message || e));
      }

      // Fallback: try to mount standalone API handlers that live under the `api/` folder
      // This helps when the full `server/` tree isn't present in the deployed bundle.
      const adaptServerlessHandler = (handler: any) => {
        return async (req: any, res: any) => {
          try {
            const reqLike = { method: req.method, headers: req.headers || {}, body: req.body || req.rawBody || undefined };
            let status = 200;
            const resLike = {
              setHeader: (k: string, v: string) => res.setHeader(k, v),
              get statusCode() { return status; },
              set statusCode(v: number) { status = v; },
              end: (b?: string) => {
                try {
                  if (!b) return res.status(status).end();
                  // Try to parse JSON first
                  try {
                    const json = JSON.parse(b);
                    return res.status(status).json(json);
                  } catch (_) {
                    return res.status(status).send(b);
                  }
                } catch (_) {
                  try { res.status(status).end(); } catch {};
                }
              },
            };
            await handler(reqLike, resLike);
          } catch (e) {
            console.error('[api/index] fallback handler error:', e);
            try { res.status(500).json({ error: 'fallback_handler_error' }); } catch {}
          }
        };
      };

      try {
        // mount POST /api/pro/create-checkout if present as a serverless-style handler
        try {
          const checkoutMod = await import('./pro/create-checkout.ts');
          if (checkoutMod && typeof checkoutMod.default === 'function') {
            app.post('/api/pro/create-checkout', adaptServerlessHandler(checkoutMod.default));
          }
        } catch (e) {
          // ignore if not present
        }

        // mount monetization webhook and confirm endpoints if available
        try {
          const monet = await import('./monetization/index.ts');
          if (monet) {
            if (typeof monet.stripeWebhook === 'function') {
              app.post('/api/monetization/stripe-webhook', monet.stripeWebhook);
            }
            if (typeof monet.confirmPurchase === 'function') {
              app.post('/api/monetization/confirm', monet.confirmPurchase);
              app.get('/api/monetization/confirm', monet.confirmPurchase);
            }
          }
        } catch (e) {
          // ignore
        }

        // If we mounted at least one fallback route, also provide a helpful default for other paths
        app.use((req, res) => {
          try {
            res.setHeader('Content-Type', 'application/json');
            res.status(500).end(JSON.stringify({ error: 'startup_error', message: String(err?.message || err), stack: String(err?.stack || '').split('\n').slice(0,10) }));
          } catch (_) {
            // ignore
          }
        });
        return app;
      } catch (e) {
        console.error('[api/index] failed to mount fallback handlers:', e);
        app.use((req, res) => {
          try {
            res.setHeader('Content-Type', 'application/json');
            res.status(500).end(JSON.stringify({ error: 'startup_error', message: String(err?.message || err), stack: String(err?.stack || '').split('\n').slice(0,10) }));
          } catch (_) {}
        });
        return app;
      }
    }

    return app as any;
  })();

  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    // Short-circuit simple health checks without loading the full server
    const url = (req.url || req.path || req.originalUrl || '').toString();
    if (url === '/api/health' || url === '/health' || url.startsWith('/api/health')) {
      try {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      } catch (_) {
        // fallthrough to normal path
      }
    }
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[api/index] Handler error:', err && err.stack ? err.stack : err);
    try {
      res.status(500).json({ error: 'Internal server error' });
    } catch {}
    // Re-throw so Vercel records the invocation failure as well
    throw err;
  }
}
