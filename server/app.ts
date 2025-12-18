import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import { registerRoutes } from "./routes";

// Build an Express app without starting a listener (usable by serverless)
export async function buildApp() {
  const app = express();
  const httpServer = createServer(app);

  app.disable("x-powered-by");

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
  (app as any).locals = (app as any).locals || {};
  (app as any).locals.metrics = metrics;

  // Minimal security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
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
  const stripeWebhookPath = "/api/webhooks/stripe";
  app.use(stripeWebhookPath, express.raw({ type: "application/json", limit: JSON_LIMIT }));

  // JSON parser for other routes
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

  function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
  }

  // Request logging + timeout
  function genReqId() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
  }

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
      if (path.startsWith("/api")) {
        try {
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
          log(JSON.stringify(logObj));
        } catch {}
      }
    };

    res.on("finish", finalize("finish"));
    res.on("close", finalize("close"));
    next();
  });

  // Register routes (no listening here)
  await registerRoutes(httpServer, app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    try {
      res.status(status).json({ message });
    } catch {}
    try {
      const details = typeof err === "object" ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      console.log(`[express] error ${status}: ${message} :: ${details}`);
    } catch {
      console.log(`[express] error ${status}: ${message}`);
    }
  });

  return app;
}
