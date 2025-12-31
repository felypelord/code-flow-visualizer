const { createServer } = require('http');
const express = require('express');
const path = require('path');

let appPromise = null;
async function getApp() {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    const app = express();
    const httpServer = createServer(app);

    app.disable('x-powered-by');

    try {
      // Load the compiled server bundle
      const compiled = require(path.resolve(process.cwd(), 'dist', 'index.cjs'));
      const registerRoutes = compiled && (compiled.registerRoutes || (compiled.default && compiled.default.registerRoutes));
      if (typeof registerRoutes === 'function') {
        await registerRoutes(httpServer, app);
        return app;
      }
      throw new Error('registerRoutes not found in compiled bundle');
    } catch (err) {
      console.error('[api/index.js] failed to load compiled server bundle:', err && (err.message || err));
      // Provide a minimal health handler so Vercel can respond
      app.get('/api/health', (req, res) => res.json({ ok: false, error: 'server bundle missing' }));
      return app;
    }
  })();
  return appPromise;
}

module.exports = async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
};
