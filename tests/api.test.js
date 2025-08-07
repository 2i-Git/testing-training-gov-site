const request = require('supertest');
const app = require('../server');

describe('Alcohol License API', () => {
    describe('Health Check', () => {
        test('GET /api/health should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version', '1.0.0');
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
                    businessPhone: '020 1234 5678',
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
                        monday: '10:00 - 23:00',
                        tuesday: '10:00 - 23:00',
                        wednesday: '10:00 - 23:00',
                        thursday: '10:00 - 23:00',
                        friday: '10:00 - 23:30',
                        saturday: '10:00 - 23:30',
                        sunday: '12:00 - 22:30'
                    }
                }
            };

            const response = await request(app)
                .post('/api/applications')
                .send(applicationData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('applicationId');
            expect(response.body.data).toHaveProperty('status', 'submitted');
            expect(response.body.data).toHaveProperty('submittedAt');

            applicationId = response.body.data.applicationId;
        });

        test('GET /api/applications should return all applications', async () => {
            const response = await request(app)
                .get('/api/applications')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /api/applications/:id should return specific application', async () => {
            const response = await request(app)
                .get(`/api/applications/${applicationId}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('applicationId', applicationId);
            expect(response.body.data).toHaveProperty('personalDetails');
            expect(response.body.data).toHaveProperty('businessDetails');
            expect(response.body.data).toHaveProperty('licenseDetails');
        });

        test('PATCH /api/applications/:id/status should update application status', async () => {
            const response = await request(app)
                .patch(`/api/applications/${applicationId}/status`)
                .send({ status: 'under-review' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Application status updated successfully');
        });

        test('POST /api/applications should validate required fields', async () => {
            const incompleteData = {
                personalDetails: {
                    firstName: 'John'
                    // Missing required fields
                }
            };

            const response = await request(app)
                .post('/api/applications')
                .send(incompleteData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body).toHaveProperty('details');
        });

        test('GET /api/applications/:id should return 404 for non-existent application', async () => {
            const response = await request(app)
                .get('/api/applications/non-existent-id')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Application not found');
        });

        test('PATCH /api/applications/:id/status should validate status values', async () => {
            const response = await request(app)
                .patch(`/api/applications/${applicationId}/status`)
                .send({ status: 'invalid-status' })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Validation failed');
        });

        // Clean up - delete the test application
        test('DELETE /api/applications/:id should delete application', async () => {
            const response = await request(app)
                .delete(`/api/applications/${applicationId}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Application deleted successfully');
        });
    });

    describe('Error Handling', () => {
        test('GET /api/non-existent-endpoint should return 404', async () => {
            const response = await request(app)
                .get('/api/non-existent-endpoint')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Not found');
        });
    });
});
