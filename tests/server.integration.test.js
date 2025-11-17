const request = require('supertest');
const { app, initApp } = require('../server');

describe('Server integration', () => {
  beforeAll(async () => {
    // Register a test route that throws, before error handlers are mounted
    app.locals.registerTestRoutes = appInstance => {
      appInstance.get('/error', () => {
        throw new Error('Test error');
      });
    };
    await initApp();
  });

  it('GET /healthz returns status ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/not-a-real-route');
    expect(res.status).toBe(404);
    expect(res.text).toMatch(/not found/i);
  });

  it('handles errors with errorHandler', async () => {
    const res = await request(app).get('/error');
    expect(res.status).toBe(500);
    expect(res.text).toMatch(/error/i);
  });
});
