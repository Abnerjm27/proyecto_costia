const fs = require('fs');
const { defineConfig, devices } = require('@playwright/test');

const phpBin = process.env.PHP_BIN || (fs.existsSync('C:\\xampp\\php\\php.exe') ? '"C:\\xampp\\php\\php.exe"' : 'php');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:8085',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `${phpBin} -S 127.0.0.1:8085`,
    url: 'http://127.0.0.1:8085/index.html',
    reuseExistingServer: true,
    timeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
