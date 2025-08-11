const { ValidationError, NotFoundError } = require('../../middleware/errorHandler');

// Mock database module BEFORE requiring service
let mockDbInstance;
jest.mock('../../database/improved-database', () => {
  class DatabaseMock {
    constructor() {
      this.connect = jest.fn().mockResolvedValue();
      this.createApplication = jest.fn().mockResolvedValue({ changes: 1 });
      this.getApplicationById = jest.fn();
      this.getAllApplications = jest.fn().mockResolvedValue([]);
      this.updateApplicationStatus = jest.fn().mockResolvedValue({ changes: 1 });
      this.deleteApplication = jest.fn().mockResolvedValue({ changes: 1 });
      this.close = jest.fn().mockResolvedValue();
      mockDbInstance = this;
    }
  }
  class DatabaseError extends Error {}
  return { Database: DatabaseMock, DatabaseError };
});

const ApplicationService = require('../../services/ApplicationService');

describe('ApplicationService', () => {
  let service;

  beforeEach(async () => {
    service = new ApplicationService();
    await service.initialize();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  const validData = () => ({
    personalDetails: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'John.Doe@Example.com',
      phoneNumber: '07123 456789',
      addressLine1: '1 Test St',
      addressLine2: '',
      addressTown: 'Testville',
      addressCounty: '',
      addressPostcode: 'AB1 2CD'
    },
    businessDetails: {
      businessName: 'Test Biz',
      companyNumber: '12345678',
      businessType: 'pub',
      businessAddressLine1: '2 Biz St',
      businessAddressLine2: '',
      businessAddressTown: 'Biztown',
      businessAddressCounty: '',
      businessAddressPostcode: 'EF3 4GH',
      businessPhone: '02070000000',
      businessEmail: 'info@test.biz'
    },
    licenseDetails: {
      licenseType: 'premises',
      premisesType: 'pub',
      premisesAddressLine1: '3 Premises Rd',
      premisesAddressLine2: '',
      premisesAddressTown: 'Premcity',
      premisesAddressCounty: '',
      premisesAddressPostcode: 'JK5 6LM',
      activities: ['sale-on'],
      operatingHours: { monday: '09:00-17:00' }
    },
    declaration: true
  });

  test('createApplication saves sanitized, structured data', async () => {
    const data = validData();
    const result = await service.createApplication(data);
    expect(result).toHaveProperty('applicationId');
    expect(result).toHaveProperty('status', 'submitted');
    // Email lower-cased & trimmed in payload passed to db
    const payload = mockDbInstance.createApplication.mock.calls[0][0];
    expect(payload.personalDetails.email).toBe('john.doe@example.com');
    expect(payload.personalDetails.phoneNumber).toBe('07123456789');
  });

  test('createApplication validation failure throws ValidationError', async () => {
    await expect(
      service.createApplication({ personalDetails: { firstName: 'Only' } })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('getApplication returns application when found', async () => {
    const fake = { applicationId: 'abc', status: 'submitted' };
    mockDbInstance.getApplicationById.mockResolvedValue(fake);
    const result = await service.getApplication('abc');
    expect(result).toEqual(fake);
  });

  test('getApplication not found throws NotFoundError', async () => {
    mockDbInstance.getApplicationById.mockResolvedValue(null);
    await expect(service.getApplication('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('getApplications enforces limit range', async () => {
    await expect(service.getApplications({ limit: 0 })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.getApplications({ limit: 101 })).rejects.toBeInstanceOf(ValidationError);
  });

  test('getApplications returns structure', async () => {
    mockDbInstance.getAllApplications.mockResolvedValue([{ applicationId: '1' }]);
    const result = await service.getApplications({ limit: 10, offset: 0 });
    expect(result.applications.length).toBe(1);
    expect(result.pagination).toEqual(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  test('updateApplicationStatus invalid status throws ValidationError', async () => {
    await expect(service.updateApplicationStatus('id1', 'bad-status')).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test('updateApplicationStatus success calls db.updateApplicationStatus', async () => {
    mockDbInstance.getApplicationById.mockResolvedValue({ applicationId: 'id1' });
    await service.updateApplicationStatus('id1', 'approved');
    expect(mockDbInstance.updateApplicationStatus).toHaveBeenCalledWith('id1', 'approved');
  });

  test('deleteApplication success', async () => {
    mockDbInstance.getApplicationById.mockResolvedValue({ applicationId: 'id1' });
    await service.deleteApplication('id1');
    expect(mockDbInstance.deleteApplication).toHaveBeenCalledWith('id1');
  });

  test('processApplicationFromFormData requires declaration', async () => {
    await expect(
      service.processApplicationFromFormData({ any: 'data' }, 'no')
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
