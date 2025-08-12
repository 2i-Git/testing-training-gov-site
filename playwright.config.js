// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 30000,
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    channel: 'msedge'
  },
  webServer: {
    command: 'NODE_ENV=test DB_PATH=:memory: node server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000
  }
});
