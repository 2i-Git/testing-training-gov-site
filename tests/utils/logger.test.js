const EventEmitter = require('events');
const loggerModule = require('../../utils/logger');
const { requestLogger, logger } = loggerModule;

describe('logger utility', () => {
  test('logger has expected methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});

describe('utils/logger requestLogger behavior (merged)', () => {
  beforeAll(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    logger.info.mockClear();
    logger.log.mockClear();
  });

  function makeReqRes(url = '/', method = 'GET', statusCode = 200) {
    const req = {
      method,
      url,
      ip: '::1',
      get: () => undefined
    };
    const res = new EventEmitter();
    res.statusCode = statusCode;
    res.get = () => undefined;
    return { req, res };
  }

  test('logs start and completion for normal request', () => {
    const { req, res } = makeReqRes('/normal', 'GET', 200);
    requestLogger(req, res, () => {});
    res.emit('finish');
    expect(logger.info).toHaveBeenCalledWith('Request started', expect.any(Object));
    expect(logger.log).toHaveBeenCalledWith('info', 'Request completed', expect.any(Object));
  });

  test('suppresses noisy font 404 logs', () => {
    const { req, res } = makeReqRes('/govuk/assets/fonts/font.woff2', 'GET', 404);
    requestLogger(req, res, () => {});
    res.emit('finish');
    expect(logger.info).not.toHaveBeenCalledWith('Request started', expect.any(Object));
    const completionCalls = logger.log.mock.calls.filter(c => c[1] === 'Request completed');
    expect(completionCalls.length).toBe(0);
  });
});
