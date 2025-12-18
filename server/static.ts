import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(
    express.static(distPath, {
      etag: true,
      maxAge: "7d",
      immutable: true,
      setHeaders: (res, filePath) => {
        // Do not cache HTML to avoid stale shell; cache assets aggressively
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
          if (process.env.NODE_ENV === "production") {
            res.setHeader(
              "Content-Security-Policy",
              [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "img-src 'self' data:",
                "font-src 'self' https://fonts.gstatic.com",
                "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
                "object-src 'none'",
                "base-uri 'self'",
                "frame-ancestors 'none'",
              ].join("; "),
            );
          }
        }
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
