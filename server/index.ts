import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { db } from "./db.js";
import { users } from "../shared/schema.js";
import { and, eq, or, lt, isNull } from "drizzle-orm";

export { registerRoutes } from "./routes.js";
export { buildApp } from "./app.js";
export default { registerRoutes };

const app = express();
const httpServer = createServer(app);
// Hide Express fingerprint
app.disable("x-powered-by");

const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || "5000", 10);
const SLOW_REQUEST_MS = parseInt(process.env.SLOW_REQUEST_MS || "2000", 10);
const JSON_LIMIT = process.env.JSON_LIMIT || "200kb";
const FORM_LIMIT = process.env.FORM_LIMIT || "200kb";
const shouldStartServer = process.env.START_SERVER !== "false" && !process.env.VERCEL;

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

// Stripe webhook requires raw body
const stripeWebhookPath = "/api/monetization/stripe-webhook";
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

if (shouldStartServer) {
  (async () => {
    try {
      await registerRoutes(httpServer, app);
    } catch (err: any) {
      console.error("[ERROR] Failed to initialize routes", err && err.stack ? err.stack : err);
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

    const basePort = parseInt(process.env.PORT || "5000", 10);
    let currentPort = basePort;
    const listenOptions: any = { port: basePort, host: "127.0.0.1" };
    if (process.platform !== "win32") {
      listenOptions.reusePort = true;
    }

    const tryListen = (p: number) => {
      currentPort = p;
      httpServer.listen({ ...listenOptions, port: p }, () => {
        log(`serving on port ${p}`);
      });
    };

    httpServer.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        const nextPort = currentPort + 1;
        log(`port ${currentPort} in use, trying ${nextPort}`);
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

    tryListen(basePort);

    // Cleanup job: remove free accounts inactive for > 60 days
    const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
    const INACTIVE_THRESHOLD_DAYS = 60;
    async function cleanupInactiveFreeAccounts() {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - INACTIVE_THRESHOLD_DAYS);
        const res = await db.delete(users).where(
          and(
            eq(users.isPro, false),
            or(
              lt(users.lastActivityDate, cutoff),
              and(isNull(users.lastActivityDate), lt(users.createdAt, cutoff))
            )
          )
        );
        // log deletion count if available
        console.log(`Cleanup: removed inactive free accounts older than ${INACTIVE_THRESHOLD_DAYS} days`);
      } catch (err) {
        console.warn('Cleanup job failed:', err);
      }
    }

    // Run once at startup (dev) and then daily
    cleanupInactiveFreeAccounts().catch(() => {});
    setInterval(() => cleanupInactiveFreeAccounts().catch(() => {}), CLEANUP_INTERVAL_MS);
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
    try {
      if (err && err.stack) log(`Stack: ${err.stack}`);
    } catch {}
  });

  process.on("beforeExit", (code) => {
    log(`beforeExit with code ${code}`);
  });

  process.on("exit", (code) => {
    log(`exit with code ${code}`);
  });

  // Graceful shutdown for signals (helpful to diagnose exit code 130 / SIGINT)
  process.on("SIGINT", () => {
    log("SIGINT received, initiating graceful shutdown...", "process");
    try {
      httpServer.close(() => {
        log("HTTP server closed after SIGINT", "process");
        process.exit(0);
      });
      // Force exit if close hangs
      setTimeout(() => {
        log("Forcing shutdown after SIGINT timeout", "process");
        process.exit(1);
      }, 5000).unref();
    } catch (err: any) {
      log(`Error during SIGINT shutdown: ${err?.message || err}`, "process");
      process.exit(1);
    }
  });

  process.on("SIGTERM", () => {
    log("SIGTERM received, initiating graceful shutdown...", "process");
    try {
      httpServer.close(() => {
        log("HTTP server closed after SIGTERM", "process");
        process.exit(0);
      });
      setTimeout(() => {
        log("Forcing shutdown after SIGTERM timeout", "process");
        process.exit(1);
      }, 5000).unref();
    } catch (err: any) {
      log(`Error during SIGTERM shutdown: ${err?.message || err}`, "process");
      process.exit(1);
    }
  });
} else {
  log("Skipping server bootstrap (shouldStartServer=false)");
}
