import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5002",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev:admin -- --port 5002",
    url: "http://127.0.0.1:5002/admin/",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://weg-test.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-public-key-not-a-secret",
    },
  },
});
