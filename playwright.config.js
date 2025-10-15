// @ts-check
const { defineConfig } = require('@playwright/test');

const isHeadless =
  process.env.PLAYWRIGHT_HEADLESS !== '0' && process.env.PLAYWRIGHT_HEADLESS !== 'false';

module.exports = defineConfig({
  timeout: 30000,
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: isHeadless,
    channel: 'msedge'
  },
  webServer: {
    command:
      'NODE_ENV=test DATABASE_URL=postgres://postgres:postgres@localhost:5433/alcohols_test node scripts/db-runner.js migrate && NODE_ENV=test DATABASE_URL=postgres://postgres:postgres@localhost:5433/alcohols_test node scripts/start-test-server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 90000
  }
});
