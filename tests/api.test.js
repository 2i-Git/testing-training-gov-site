const request = require('supertest');
const { app, initApp, applicationService } = require('../server');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initApp();
});

afterAll(async () => {
  if (applicationService && applicationService.close) {
    await applicationService.close();
  }
});

describe('Alcohol License API', () => {
  describe('Health Check', () => {
    test('GET /api/health should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Applications API', () => {
    let applicationId;

    test('POST /api/applications should create a new application', async () => {
      const applicationData = {
        personalDetails: {
          firstName: 'John',
          lastName: 'Smith',
          dateOfBirth: '1985-03-15',
          email: 'john.smith@example.com',
          phoneNumber: '07123456789',
          address: {
            line1: '123 High Street',
            line2: '',
            town: 'London',
            county: '',
            postcode: 'SW1A 1AA'
          }
        },
        businessDetails: {
          businessName: 'The Red Lion',
          companyNumber: '12345678',
          businessType: 'pub',
          businessPhone: '02012345678',
          businessEmail: 'info@redlion.com',
          businessAddress: {
            line1: '456 Pub Street',
            line2: '',
            town: 'London',
            county: '',
            postcode: 'SW1A 2BB'
          }
        },
        licenseDetails: {
          licenseType: 'premises',
          premisesType: 'pub',
          premisesAddress: {
            line1: '456 Pub Street',
            line2: '',
            town: 'London',
            county: '',
            postcode: 'SW1A 2BB'
          },
          activities: ['sale-on', 'regulated-entertainment'],
          operatingHours: {
            monday: '10:00 - 23:00'
          }
        },
        declaration: true
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('applicationId');
      expect(response.body.data).toHaveProperty('status', 'submitted');
      applicationId = response.body.data.applicationId;
    });

    test('GET /api/applications should return applications array', async () => {
      const response = await request(app).get('/api/applications').expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/applications/:id should return the application', async () => {
      const response = await request(app).get(`/api/applications/${applicationId}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('applicationId', applicationId);
    });

    test('PATCH /api/applications/:id/status should update status', async () => {
      const response = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .send({ status: 'under-review' })
        .expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Application status updated successfully');
    });

    test('POST /api/applications should validate required fields', async () => {
      const incompleteData = { personalDetails: { firstName: 'John' } };
      const response = await request(app)
        .post('/api/applications')
        .send(incompleteData)
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('GET /api/applications/:id with invalid id returns 404', async () => {
      const response = await request(app).get('/api/applications/non-existent-id').expect(404);
      expect(response.body).toHaveProperty('success', false);
    });

    test('PATCH /api/applications/:id/status invalid status returns error', async () => {
      const response = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .send({ status: 'not-a-real-status' })
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('DELETE /api/applications/:id should delete the application', async () => {
      const response = await request(app).delete(`/api/applications/${applicationId}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/non-existent-endpoint should return 404', async () => {
      const response = await request(app).get('/api/non-existent-endpoint').expect(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
