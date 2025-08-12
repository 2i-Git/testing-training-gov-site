const request = require('supertest');
const { app, initApp, applicationService } = require('../../server');

function extractCsrf(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  return match ? match[1] : null;
}

async function seedApplication(overrides = {}) {
  const base = {
    personalDetails: {
      firstName: 'Alice',
      lastName: 'Admin',
      email: 'alice@example.com',
      phoneNumber: '07123456789'
    },
    businessDetails: {
      businessName: 'Test Biz',
      businessType: 'shop'
    },
    licenseDetails: {
      licenseType: 'premises',
      premisesType: 'shop'
    },
    declaration: true
  };
  return applicationService.createApplication({ ...base, ...overrides });
}

describe('Admin routes flow', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initApp();
  });

  test('GET /admin/login serves login page with CSRF token', async () => {
    const res = await request(app).get('/admin/login');
    expect(res.status).toBe(200);
    expect(extractCsrf(res.text)).toBeTruthy();
  });

  test('GET /admin/applications without auth redirects to login', async () => {
    const res = await request(app).get('/admin/applications');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/login');
  });

  test('POST /admin/login invalid credentials returns error message', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrf(loginPage.text);
    const res = await agent
      .post('/admin/login')
      .type('form')
      .send({ email: 'nope@example.com', password: 'wrong', _csrf: token });
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Invalid email or password/);
  });

  test('Successful admin login and applications listing', async () => {
    await seedApplication();
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrf(loginPage.text);
    const loginRes = await agent
      .post('/admin/login')
      .type('form')
      .send({ email: 'admin@example.com', password: 'admin123', _csrf: token });
    expect(loginRes.status).toBe(302);
    expect(loginRes.headers.location).toBe('/admin/applications');
    const appsPage = await agent.get('/admin/applications');
    expect(appsPage.status).toBe(200);
  });

  test('Invalid status update returns 400', async () => {
    const { applicationId } = await seedApplication();
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrf(loginPage.text);
    await agent
      .post('/admin/login')
      .type('form')
      .send({ email: 'admin@example.com', password: 'admin123', _csrf: token });
    const appsPage = await agent.get('/admin/applications');
    const token2 = extractCsrf(appsPage.text);
    const res = await agent
      .post(`/admin/applications/${applicationId}/status`)
      .type('form')
      .send({ status: 'not-valid', _csrf: token2 });
    expect(res.status).toBe(400);
    expect(res.text).toMatch(/Invalid status/);
  });

  test('Successful status update redirects with success message', async () => {
    const { applicationId } = await seedApplication();
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrf(loginPage.text);
    await agent
      .post('/admin/login')
      .type('form')
      .send({ email: 'admin@example.com', password: 'admin123', _csrf: token });
    const appsPage = await agent.get('/admin/applications');
    const token2 = extractCsrf(appsPage.text);
    const res = await agent
      .post(`/admin/applications/${applicationId}/status`)
      .type('form')
      .send({ status: 'approved', _csrf: token2 });
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/success=Application%20approved%20successfully/);
  });

  test('Status update failure path redirects with error', async () => {
    const { applicationId } = await seedApplication();
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrf(loginPage.text);
    await agent
      .post('/admin/login')
      .type('form')
      .send({ email: 'admin@example.com', password: 'admin123', _csrf: token });
    const appsPage = await agent.get('/admin/applications');
    const token2 = extractCsrf(appsPage.text);

    // Temporarily mock updateApplicationStatus to throw
    const original = applicationService.updateApplicationStatus;
    applicationService.updateApplicationStatus = jest.fn().mockRejectedValue(new Error('DB fail'));

    const res = await agent
      .post(`/admin/applications/${applicationId}/status`)
      .type('form')
      .send({ status: 'approved', _csrf: token2 });

    // Restore original
    applicationService.updateApplicationStatus = original;

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/error=Failed%20to%20update%20application%20status/);
  });
});
