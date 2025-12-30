import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(__dirname, "client"),
  // Keep Vite cache inside the client folder to avoid writing temp files
  // into the repository root (which can trigger watchers/HMR restarts).
  cacheDir: path.resolve(__dirname, "client", "node_modules", ".vite"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["localhost", "127.0.0.1", "*.localhost"],
    // Proxy API calls to the backend server so the dev client can use relative `/api` paths
    proxy: {
      '/api': {
        // Respect BACKEND_PORT env var falling back to 5000 (allows backend to run on 5001)
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || 5000}`,
        changeOrigin: true,
        secure: false,
      },
    },
    // Allow Vite to access the repository root and node_modules so
    // the built-in client script (`/@vite/client`) and dependency
    // resolution work correctly. Denying `node_modules` here causes
    // the dev client to return 404.
    fs: {
      strict: true,
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'client'),
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'client', 'node_modules'),
      ],
    },
    watch: {
      // Ignore node_modules and build outputs so temp files don't trigger restarts
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/dist/public/**"],
    },
  },
});
