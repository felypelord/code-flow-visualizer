import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config.js";
import fs from "fs";
import path from "path";

const viteLogger = createLogger();
let cachedTemplate: string | null = null;
let templateCachePath: string | null = null;

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: ["localhost", "127.0.0.1", process.env.VITE_HOST || "localhost"],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  const clientTemplate = path.resolve(
    import.meta.dirname,
    "..",
    "client",
    "index.html",
  );

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Cache template file path and invalidate on file change
      if (templateCachePath !== clientTemplate) {
        cachedTemplate = null;
        templateCachePath = clientTemplate;
      }

      let template = cachedTemplate;
      if (!template) {
        template = await fs.promises.readFile(clientTemplate, "utf-8");
        cachedTemplate = template;
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
