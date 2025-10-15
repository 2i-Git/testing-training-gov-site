#!/usr/bin/env node
// Starts the app server explicitly in test mode
// Useful for Playwright's webServer which expects a running HTTP server

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { startServer } = require('../server');

(async () => {
  try {
    await startServer();
    // Keep process alive; server returns an http.Server instance
  } catch (err) {
    console.error('Failed to start test server:', err);
    process.exit(1);
  }
})();
