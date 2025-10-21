const request = require('supertest');
const { app, initApp, applicationService } = require('../../server');

function extractCsrf(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  return match ? match[1] : null;
}

describe('User routes end-to-end flow', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initApp();
  });

  afterAll(async () => {
    await applicationService.close();
  });

  test('happy path: login -> personal -> business -> license -> summary -> submit -> confirmation', async () => {
    const agent = request.agent(app);

    // Login
    const loginPage = await agent.get('/login');
    expect(loginPage.status).toBe(200);
    const csrf1 = extractCsrf(loginPage.text);
    const loginRes = await agent
      .post('/login')
      .type('form')
      .send({ email: 'user@example.com', password: 'password123', _csrf: csrf1 });
    expect(loginRes.status).toBe(302);
    expect(loginRes.headers.location).toBe('/personal-details');

    // Personal details
    const pdPage = await agent.get('/personal-details');
    const csrf2 = extractCsrf(pdPage.text);
    const pdRes = await agent
      .post('/personal-details')
      .type('form')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        dobDay: '10',
        dobMonth: '5',
        dobYear: String(new Date().getFullYear() - 20),
        email: 'john@example.com',
        phoneNumber: '07123456789',
        addressLine1: '1 Test St',
        addressLine2: '',
        addressTown: 'Town',
        addressCounty: '',
        addressPostcode: 'SW1A 1AA',
        _csrf: csrf2
      });
    expect(pdRes.status).toBe(302);
    expect(pdRes.headers.location).toBe('/business-details');

    // Business details
    const bdPage = await agent.get('/business-details');
    const csrf3 = extractCsrf(bdPage.text);
    const bdRes = await agent.post('/business-details').type('form').send({
      businessName: 'Biz Ltd',
      businessType: 'shop',
      businessAddressLine1: '2 Biz St',
      businessAddressLine2: '',
      businessAddressTown: 'Biztown',
      businessAddressCounty: '',
      businessAddressPostcode: 'EC1A 1BB',
      businessPhone: '02070000000',
      businessEmail: 'info@biz.com',
      _csrf: csrf3
    });
    expect(bdRes.status).toBe(302);
    expect(bdRes.headers.location).toBe('/license-details');

    // License details (activities as single string, should normalize to array)
    const ldPage = await agent.get('/license-details');
    const csrf4 = extractCsrf(ldPage.text);
    const ldRes = await agent.post('/license-details').type('form').send({
      licenseType: 'premises',
      premisesType: 'shop',
      premisesAddressLine1: '3 Prem Rd',
      premisesAddressLine2: '',
      premisesAddressTown: 'Premcity',
      premisesAddressCounty: '',
      premisesAddressPostcode: 'W1A 0AX',
      activities: 'sale-on',
      _csrf: csrf4
    });
    expect(ldRes.status).toBe(302);
    expect(ldRes.headers.location).toBe('/summary');

    // Summary and submit
    const summaryPage = await agent.get('/summary');
    expect(summaryPage.status).toBe(200);
    const csrf5 = extractCsrf(summaryPage.text);

    // Mock the final submission to control applicationId and avoid DB effects surprises
    const spy = jest
      .spyOn(applicationService, 'processApplicationFromFormData')
      .mockResolvedValue({ applicationId: 'test-app-id', status: 'submitted' });

    const submitRes = await agent
      .post('/summary')
      .type('form')
      .send({ declaration: 'yes', _csrf: csrf5 });
    expect(submitRes.status).toBe(302);
    expect(submitRes.headers.location).toBe('/confirmation');

    spy.mockRestore();

    // Confirmation shows applicationId in page
    const conf = await agent.get('/confirmation');
    expect(conf.status).toBe(200);
    expect(conf.text).toMatch(/test-app-id/);
  });

  test('summary submission error path renders 500 with error message', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/login');
    const csrf1 = extractCsrf(loginPage.text);
    await agent
      .post('/login')
      .type('form')
      .send({ email: 'user@example.com', password: 'password123', _csrf: csrf1 });

    // Seed minimum session journey quickly by posting valid steps
    const pdPage = await agent.get('/personal-details');
    const csrf2 = extractCsrf(pdPage.text);
    await agent
      .post('/personal-details')
      .type('form')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        dobDay: '10',
        dobMonth: '5',
        dobYear: String(new Date().getFullYear() - 20),
        email: 'john@example.com',
        phoneNumber: '07123456789',
        addressLine1: '1 Test St',
        addressLine2: '',
        addressTown: 'Town',
        addressCounty: '',
        addressPostcode: 'SW1A 1AA',
        _csrf: csrf2
      });
    const bdPage = await agent.get('/business-details');
    const csrf3 = extractCsrf(bdPage.text);
    await agent.post('/business-details').type('form').send({
      businessName: 'Biz Ltd',
      businessType: 'shop',
      businessAddressLine1: '2 Biz St',
      businessAddressLine2: '',
      businessAddressTown: 'Biztown',
      businessAddressCounty: '',
      businessAddressPostcode: 'EC1A 1BB',
      businessPhone: '02070000000',
      businessEmail: 'info@biz.com',
      _csrf: csrf3
    });
    const ldPage = await agent.get('/license-details');
    const csrf4 = extractCsrf(ldPage.text);
    await agent.post('/license-details').type('form').send({
      licenseType: 'premises',
      premisesType: 'shop',
      premisesAddressLine1: '3 Prem Rd',
      premisesAddressLine2: '',
      premisesAddressTown: 'Premcity',
      premisesAddressCounty: '',
      premisesAddressPostcode: 'W1A 0AX',
      activities: 'sale-on',
      _csrf: csrf4
    });

    const summary = await agent.get('/summary');
    const csrf5 = extractCsrf(summary.text);

    // Use jest.spyOn for robust error mocking
    const spy = jest
      .spyOn(applicationService, 'processApplicationFromFormData')
      .mockRejectedValueOnce(new Error('boom'));

    const res = await agent
      .post('/summary')
      .type('form')
      .send({ declaration: 'yes', _csrf: csrf5 });

    spy.mockRestore();
    expect(res.status).toBe(500);
    console.log('DEBUG ERROR RESPONSE:', res.text);
    expect(res.text).toContain(
      'An error occurred while submitting your application. Please try again.'
    );
  });
});
