import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // IMPORTANT: Do not inherit Vite's `root: client/` from `vite.config.ts`.
  // Tests in this repo live at the repository root under `tests/`.
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
