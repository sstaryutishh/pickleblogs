import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    ...devices["Desktop Chrome"],
    // Uses a local browser when configured, or Playwright Chromium in CI.
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/blog",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
