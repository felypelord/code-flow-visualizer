import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);
// Hide Express fingerprint
app.disable("x-powered-by");

const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || "5000", 10);
const SLOW_REQUEST_MS = parseInt(process.env.SLOW_REQUEST_MS || "2000", 10);
const JSON_LIMIT = process.env.JSON_LIMIT || "200kb";
const FORM_LIMIT = process.env.FORM_LIMIT || "200kb";

type PathMetric = { count: number; slow: number };
type Metrics = {
  startTime: number;
  totalRequests: number;
  errorRequests: number;
  slowRequests: number;
  perPath: Record<string, PathMetric>;
};

const metrics: Metrics = {
  startTime: Date.now(),
  totalRequests: 0,
  errorRequests: 0,
  slowRequests: 0,
  perPath: {},
};
// expose to routes
(app as any).locals = (app as any).locals || {};
(app as any).locals.metrics = metrics;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Minimal security headers without extra deps
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});
// Prevent caching of API responses
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

app.use(compression({ threshold: 1024 }));

// Stripe webhook requires raw body, so install a raw parser for that route only
const stripeWebhookPath = "/api/webhooks/stripe";
app.use(stripeWebhookPath, express.raw({ type: "application/json", limit: JSON_LIMIT }));

// For all other routes, use JSON parser. Skip JSON parse on webhook path.
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

app.use(
  express.urlencoded({
    extended: false,
    limit: FORM_LIMIT,
  }),
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request ID generator (simple, avoids extra deps)
function genReqId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

// Structured logging + per-request timeout
app.use((req, res, next) => {
  const startNs = process.hrtime.bigint();
  const reqId = (req.headers["x-request-id"] as string) || genReqId();
  (res as any).reqId = reqId;
  (res as any).startNs = startNs;
  res.setHeader("X-Request-Id", reqId);

  const path = req.path;
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ message: "Request timeout" });
    }
  }, REQUEST_TIMEOUT_MS);

  const finalize = (label: "finish" | "close") => () => {
    clearTimeout(timeout);
    const durationMs = Number((process.hrtime.bigint() - startNs) / BigInt(1000000));

    // metrics aggregation
    try {
      metrics.totalRequests++;
      if (res.statusCode >= 500) metrics.errorRequests++;
      const p: PathMetric = metrics.perPath[path] || { count: 0, slow: 0 };
      p.count++;
      if (durationMs > SLOW_REQUEST_MS) {
        metrics.slowRequests++;
        p.slow++;
      }
      metrics.perPath[path] = p;
    } catch {}

    const logObj: Record<string, any> = {
      reqId,
      method: req.method,
      path,
      status: res.statusCode,
      durationMs,
      ua: req.headers["user-agent"],
      when: new Date().toISOString(),
      evt: label,
    };
    if (path.startsWith("/api")) {
      log(JSON.stringify(logObj));
    }
  };

  res.on("finish", finalize("finish"));
  res.on("close", finalize("close"));

  next();
});

(async () => {
  try {
    await registerRoutes(httpServer, app);
  } catch (err: any) {
    console.error("[ERROR] Failed to initialize routes");
    process.exit(1);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    try {
      res.status(status).json({ message });
    } catch (_) {
      // ignore write errors
    }
    try {
      const details = typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      log(`error ${status}: ${message} :: ${details}`, "express");
    } catch {
      log(`error ${status}: ${message}`, "express");
    }
  });

  // Setup Vite or static files
  const devStatic = process.env.DEV_STATIC === "true";
  if (process.env.NODE_ENV === "production" || devStatic) {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: any = { port, host: "127.0.0.1" };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  const tryListen = (p: number) => {
    httpServer.listen({ ...listenOptions, port: p }, () => {
      log(`serving on port ${p}`);
    });
  };

  httpServer.on('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      log(`port ${port} in use, trying ${nextPort}`);
      tryListen(nextPort);
    } else {
      try {
        const msg = (err && err.message) || String(err);
        log(`httpServer error: ${msg}`);
      } catch {}
      // Keep process alive in dev to aid debugging
      if (process.env.NODE_ENV !== 'production') return;
      // In production, allow process manager to restart
      setTimeout(() => process.exit(1), 10);
    }
  });

  tryListen(port);
})().catch(err => {
  console.error("[ASYNC IIFE ERROR]", err?.message || err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

setInterval(() => {}, 1000000);

process.on("unhandledRejection", (reason: any) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  log(`Unhandled rejection: ${msg}`);
});

process.on("uncaughtException", (err: any) => {
  const msg = err instanceof Error ? err.message : String(err);
  log(`Uncaught exception: ${msg}`);
});

process.on("beforeExit", (code) => {
  log(`beforeExit with code ${code}`);
});

process.on("exit", (code) => {
  log(`exit with code ${code}`);
});
