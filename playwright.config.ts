import { defineConfig, devices } from "@playwright/test";

const port = String(process.env.E2E_PORT || process.env.PORT || "5000");
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `cross-env PORT=${port} NODE_ENV=development tsx -r dotenv/config server/index.ts`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
