import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, writeFile, cp } from "fs/promises";
import path from 'path';

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Prepare Vercel Build Output API bundle so deployment has a single function
  try {
    const out = '.vercel/output';
    const funcDir = path.join(out, 'functions', 'api', 'index.func');
    await rm(out, { recursive: true, force: true });
    await mkdir(funcDir, { recursive: true });

    // Write a thin handler that requires the compiled server bundle
    const handler = `
const { createServer } = require('http');
const express = require('express');
const path = require('path');

// Load the compiled server bundle
let compiled;
try {
  compiled = require(path.resolve(process.cwd(), 'dist', 'index.cjs'));
} catch (e) {
  try {
    compiled = require('../dist/index.cjs');
  } catch (e2) {
    console.error('[vercel handler] failed to load compiled bundle', e, e2);
    throw e2;
  }
}

const registerRoutes = compiled && (compiled.registerRoutes || (compiled.default && compiled.default.registerRoutes));
if (!registerRoutes) {
  throw new Error('registerRoutes not found in compiled bundle');
}

const app = express();
const httpServer = createServer(app);
registerRoutes(httpServer, app);

module.exports = async (req, res) => {
  return app(req, res);
};
`;

    await writeFile(path.join(funcDir, 'index.js'), handler, 'utf-8');

    // Copy static public files to .vercel/output/static
    const staticOut = path.join(out, 'static');
    await mkdir(staticOut, { recursive: true });
    const publicDir = path.join('dist', 'public');
    try {
      await cp(publicDir, staticOut, { recursive: true });
    } catch (e) {
      console.warn('[build] failed to copy public dir to .vercel/output/static:', e && e.message);
    }
  } catch (e) {
    console.warn('[build] failed to prepare vercel output:', e && e.message);
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
