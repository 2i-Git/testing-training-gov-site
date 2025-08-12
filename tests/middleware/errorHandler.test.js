const {
  AppError,
  ValidationError,
  NotFoundError,
  errorHandler,
  notFoundHandler
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

// Additional helper that supports render(), used by extra branches
function runWithRender(handler, err, reqProps = {}) {
  return new Promise(resolve => {
    const req = {
      path: reqProps.path || '/api/x',
      originalUrl: reqProps.originalUrl || reqProps.path || '/api/x',
      method: reqProps.method || 'GET',
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
        resolve({ kind: 'json', code: this.statusCode, payload });
      },
      render(view, model) {
        resolve({ kind: 'render', code: this.statusCode, view, model });
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

describe('errorHandler extra branches (merged)', () => {
  const OLD_ENV = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });
  afterAll(() => {
    process.env.NODE_ENV = OLD_ENV;
  });

  test('translates CastError to NotFound', async () => {
    const err = { name: 'CastError', message: 'bad id' };
    const { code, payload } = await runWithRender(errorHandler, err);
    expect(code).toBe(404);
    expect(payload.error).toBe('NOT_FOUND');
  });

  test('code 11000 maps to duplicate validation error', async () => {
    const err = { code: 11000, message: 'dup' };
    const { code, payload } = await runWithRender(errorHandler, err);
    expect(code).toBe(400);
    expect(payload.error).toBe('VALIDATION_ERROR');
    expect(payload.message).toMatch(/Duplicate/);
  });

  test('SQLITE constraint codes mapped to validation errors', async () => {
    const fkErr = { code: 'SQLITE_CONSTRAINT_FOREIGNKEY', message: 'fk' };
    const uqErr = { code: 'SQLITE_CONSTRAINT_UNIQUE', message: 'uq' };
    let r = await runWithRender(errorHandler, fkErr);
    expect(r.code).toBe(400);
    expect(r.payload.error).toBe('VALIDATION_ERROR');
    r = await runWithRender(errorHandler, uqErr);
    expect(r.code).toBe(400);
    expect(r.payload.error).toBe('VALIDATION_ERROR');
  });

  test('non-API GET renders error page', async () => {
    const err = new Error('Boom');
    const result = await runWithRender(errorHandler, err, { path: '/home', method: 'GET' });
    expect(result.kind).toBe('render');
    expect(result.view).toBe('error');
  });

  test('notFoundHandler forwards NotFoundError with originalUrl', async () => {
    const forwarded = await new Promise(resolve => {
      const req = { originalUrl: '/api/missing', path: '/api/missing' };
      const res = {};
      const next = e => resolve(e);
      notFoundHandler(req, res, next);
    });
    const out = await runWithRender(errorHandler, forwarded, {
      path: '/api/missing',
      method: 'GET'
    });
    expect(out.code).toBe(404);
    expect(out.payload.message).toMatch(/not found/i);
  });
});
