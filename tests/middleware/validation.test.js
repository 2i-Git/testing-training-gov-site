const {
  validators,
  personalDetailsValidation,
  businessDetailsValidation,
  licenseDetailsValidation,
  declarationValidation
} = require('../../middleware/validation');

// Helper to run a validation middleware array against a fake req/res
async function runValidation(middlewares, body, path = '/api/test') {
  const req = { body, path, method: 'POST' };
  const res = {
    statusCode: 200,
    _json: null,
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(obj) {
      this._json = obj;
      return this;
    }
  };
  for (const mw of middlewares) {
    // Each express-validator middleware returns a promise when executed
    await mw(req, res, () => {});
    if (res._json) break; // stop if error sent
  }
  return { req, res };
}

describe('validators unit tests', () => {
  test('ukPostcode valid and invalid', () => {
    expect(validators.ukPostcode('SW1A 1AA')).toBe(true);
    expect(validators.ukPostcode('INVALID')).toBe(false);
  });
  test('ukPhone valid and invalid', () => {
    expect(validators.ukPhone('+447912345678')).toBe(true);
    expect(validators.ukPhone('07123 456789')).toBe(true);
    expect(validators.ukPhone('12345')).toBe(false);
  });
  test('dateOfBirth valid, underage, invalid date', () => {
    const now = new Date();
    const year = now.getFullYear() - 20; // valid age
    expect(validators.dateOfBirth(10, 5, year)).toBe(true);
    const underYear = now.getFullYear() - 10; // underage
    expect(validators.dateOfBirth(10, 5, underYear)).toBe(false);
    expect(validators.dateOfBirth(31, 2, year)).toBe(false); // invalid date
  });
  test('businessType valid / invalid', () => {
    expect(validators.businessType('pub')).toBe(true);
    expect(validators.businessType('shop')).toBe(true); // now supported in validation lists
    expect(validators.businessType('invalid')).toBe(false);
  });
  test('licenseType and premisesType', () => {
    expect(validators.licenseType('premises')).toBe(true);
    expect(validators.licenseType('bad')).toBe(false);
    expect(validators.premisesType('hotel')).toBe(true);
    expect(validators.premisesType('bad')).toBe(false);
  });
  test('companyNumber valid / invalid', () => {
    expect(validators.companyNumber('12345678')).toBe(true);
    expect(validators.companyNumber('1234')).toBe(false);
  });
});

describe('validation middleware integration (API mode)', () => {
  test('personalDetailsValidation collects multiple errors', async () => {
    const body = {
      firstName: '',
      lastName: '',
      dobDay: 1,
      dobMonth: 1,
      dobYear: 2015,
      email: 'not-an-email',
      phoneNumber: 'bad',
      addressLine1: '',
      addressTown: '',
      addressPostcode: 'BAD'
    };
    const { res } = await runValidation(personalDetailsValidation, body);
    expect(res.statusCode).toBe(400);
    expect(res._json).toBeTruthy();
    expect(res._json.error).toBe('Validation failed');
    expect(res._json.details.length).toBeGreaterThan(4);
  });

  test('businessDetailsValidation passes with minimal valid data', async () => {
    const body = {
      businessName: 'Biz',
      businessType: 'pub',
      businessAddressLine1: 'Line',
      businessAddressTown: 'Town',
      businessAddressPostcode: 'SW1A 1AA',
      businessPhone: '+447912345678'
    };
    const { res, req } = await runValidation(businessDetailsValidation, body);
    expect(res._json).toBeNull();
    expect(req.validationErrors).toBeUndefined();
  });

  test('licenseDetailsValidation activities required', async () => {
    const body = {
      licenseType: 'premises',
      premisesType: 'pub',
      premisesAddressLine1: 'Line',
      premisesAddressTown: 'Town',
      premisesAddressPostcode: 'SW1A 1AA',
      activities: []
    };
    const { res } = await runValidation(licenseDetailsValidation, body);
    expect(res.statusCode).toBe(400);
    expect(res._json).toBeTruthy();
    // Should contain an activities validation error
    expect(res._json.details.some(d => d.path === 'activities')).toBe(true);
  });

  test('declarationValidation requires yes', async () => {
    const body = { declaration: 'no' };
    const { res } = await runValidation(declarationValidation, body);
    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('Validation failed');
  });
});
