const request = require('supertest');
const { app, initApp, applicationService } = require('../../server');

function extractCsrf(html) {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  return m ? m[1] : null;
}

describe('CSRF protection middleware', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initApp();
  });

  afterAll(async () => {
    if (applicationService && applicationService.close) {
      await applicationService.close();
    }
  });

  test('POST /login without CSRF token returns 403 and re-renders login form', async () => {
    // Get login to establish session but intentionally do not include token in POST
    await request(app).get('/login');
    const res = await request(app).post('/login').type('form').send({ email: 'x', password: 'y' });
    expect(res.status).toBe(403);
    // Login page rendered, includes CSRF hidden field for next attempt
    expect(res.text).toMatch(/<h1[^>]*>\s*Sign in\s*<\/h1>/i);
    expect(res.text).toMatch(/name="_csrf" value="/);
  });

  test('Admin status POST with invalid CSRF redirects with error message', async () => {
    // Login as admin properly to access applications page
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrf(loginPage.text);
    await agent
      .post('/admin/login')
      .type('form')
      .send({ email: 'admin@example.com', password: 'admin123', _csrf: token });

    // Try to post status without valid CSRF token (omit _csrf)
    const id = 'fake-id';
    const res = await agent
      .post(`/admin/applications/${id}/status`)
      .type('form')
      .send({ status: 'approved' });
    // Express issues a 302 redirect here
    expect(res.status).toBe(302);
    // Should redirect back to applications with error param (URL-encoded)
    expect(res.headers.location).toBe('/admin/applications?error=Invalid%20CSRF%20token');
  });
});
