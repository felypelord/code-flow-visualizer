// @ts-nocheck
import express from 'express';
import compression from 'compression';
import { createServer } from 'http';

// Create and reuse the Express app across invocations to reduce cold starts
let appPromise: Promise<any> | null = null;
const bootedAt = new Date().toISOString();
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

    let registeredFromRoutes = false;
    let registrationError: any = null;
    try {
      // Use dynamic import with .js extension - Vercel transpiles .ts to .js
      const routesModule = await import('../server/routes.js');
      await routesModule.registerRoutes(httpServer as any, app as any);
      registeredFromRoutes = true;
    } catch (err: any) {
      registrationError = String(err && (err.stack || err.message || err));
      console.error('[api/index] Failed to register routes:', registrationError);
    }

    // Diagnostics to verify whether routing is registered in serverless
    app.get('/api/_bundle_status', (_req, res) => {
      res.json({
        ok: true,
        registeredFromRoutes,
        compiledExists: false,
        compiledPath: null,
        registrationError,
        bootedAt,
        vercel: {
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
          gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
          gitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG || null,
          environment: process.env.VERCEL_ENV || null,
        },
      });
    });

    app.get('/api/_routes', (_req, res) => {
      try {
        const routes = (app as any)._router?.stack
          ?.filter((r: any) => r.route)
          ?.map((r: any) => {
            const methods = Object.keys(r.route.methods || {}).map((m) => m.toUpperCase()).join(',');
            return `${methods} ${r.route.path}`;
          }) || [];
        res.json({ ok: true, routes, registeredFromRoutes });
      } catch (e: any) {
        res.status(500).json({ ok: false, error: e?.message || String(e), registeredFromRoutes });
      }
    });

    if (!registeredFromRoutes) {
      app.use((req, res) => {
        res.status(500).json({ ok: false, error: 'startup_error', registeredFromRoutes });
      });
    }

    return app as any;
  })();

  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const url = (req.url || req.path || req.originalUrl || '').toString();
    
    // Restore original API path when routed via Vercel rewrite (?path=...)
    try {
      const originalPath = req?.query?.path;
      if (originalPath) {
        const normalized = originalPath.startsWith('/api/') ? originalPath : `/api/${originalPath}`;
        req.url = normalized;
        req.path = normalized;
        req.originalUrl = normalized;
      }
    } catch (_) {}

    // Short-circuit simple health checks without loading the full server
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
