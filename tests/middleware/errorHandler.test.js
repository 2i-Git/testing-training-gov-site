const {
  AppError,
  ValidationError,
  NotFoundError,
  errorHandler
} = require('../../middleware/errorHandler');

// Helper to invoke middleware
function run(handler, err, reqProps = {}) {
  return new Promise(resolve => {
    const req = {
      path: '/api/test',
      method: 'GET',
      headers: {},
      get: h => req.headers[h.toLowerCase()] || '',
      ip: '::1',
      ...reqProps
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ code: this.statusCode, payload });
      }
    };
    handler(err, req, res, () => {});
  });
}

describe('errorHandler middleware', () => {
  const OLD_ENV = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });
  afterAll(() => {
    process.env.NODE_ENV = OLD_ENV;
  });

  test('ValidationError maps to 400 with proper body', async () => {
    const err = new ValidationError('Invalid data', ['x']);
    const { code, payload } = await run(errorHandler, err);
    expect(code).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid data'
      })
    );
  });

  test('NotFoundError maps to 404', async () => {
    const err = new NotFoundError('Thing');
    const { code } = await run(errorHandler, err);
    expect(code).toBe(404);
  });

  test('Generic AppError uses its status', async () => {
    const err = new AppError('Boom', 418, 'TEAPOT');
    const { code, payload } = await run(errorHandler, err);
    expect(code).toBe(418);
    expect(payload.error).toBe('TEAPOT');
  });

  test('Unknown error defaults to 500', async () => {
    const err = new Error('Unknown');
    const { code, payload } = await run(errorHandler, err);
    expect(code).toBe(500);
    expect(payload.error).toBe('INTERNAL_ERROR');
  });
});
