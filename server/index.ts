import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || "15000", 10);
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
  // Prevent framing and clickjacking
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Prevent referrer leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // CORS isolation
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  
  // Content Security Policy - block all third-party resources
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'nonce-" + (res as any).nonceValue + "'; " +
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // Additional hardening
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  
  next();
});

app.use(compression({ threshold: 1024 }));

app.use(
  express.json({
    limit: JSON_LIMIT,
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

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
    console.error("[STARTUP ERROR]", err);
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
    // Log the error but do NOT rethrow (rethrow was crashing the server)
    try {
      const details = typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      log(`error ${status}: ${message} :: ${details}`, "express");
    } catch {
      log(`error ${status}: ${message}`, "express");
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: any = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") {
    // reusePort can cause ENOTSUP on Windows; enable only on non-Windows
    listenOptions.reusePort = true;
  }

  const tryListen = (p: number) => {
    const opts = { ...listenOptions, port: p };
    httpServer.listen(opts, () => {
      log(`serving on port ${p}`);
    });
  };

  httpServer.on('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      log(`port ${port} in use, trying ${nextPort}`);
      tryListen(nextPort);
    } else {
      throw err;
    }
  });

  tryListen(port);
})().catch(err => {
  console.error("[ASYNC IIFE ERROR]", err);
  process.exit(1);
});

// Keep the process alive
if (process.env.NODE_ENV === "development") {
  process.stdin.resume();
}

// Global process-level error handling to avoid unexpected crashes
process.on("unhandledRejection", (reason: any) => {
  try {
    const details = typeof reason === 'object' ? JSON.stringify(reason, Object.getOwnPropertyNames(reason)) : String(reason);
    console.error("[unhandledRejection]", details);
  } catch {
    console.error("[unhandledRejection]", reason);
  }
});

process.on("uncaughtException", (err: any) => {
  try {
    const details = typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
    console.error("[uncaughtException]", details);
  } catch {
    console.error("[uncaughtException]", err);
  }
});
