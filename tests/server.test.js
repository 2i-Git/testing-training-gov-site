describe('server init/start extra paths', () => {
  const origEnv = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    jest.resetModules();
  });
  afterAll(async () => {
    process.env.NODE_ENV = origEnv;
    try {
      const serverMod = require('../server');
      if (serverMod && serverMod.applicationService && serverMod.applicationService.close) {
        await serverMod.applicationService.close();
      }
      if (serverMod && serverMod.app) {
        serverMod.app.locals.initialized = false;
      }
    } catch {
      // ignore errors in teardown
    }
  });

  test('initApp is idempotent (initialize called once)', async () => {
    const serverMod = require('../server');
    const { app, initApp, applicationService } = serverMod;
    const spy = jest.spyOn(applicationService, 'initialize');

    await initApp();
    await initApp();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(app.locals.initialized).toBe(true);
  });

  test('startServer propagates init failure', async () => {
    const serverMod = require('../server');
    const { startServer, applicationService } = serverMod;
    jest.spyOn(applicationService, 'initialize').mockRejectedValue(new Error('init boom'));

    await expect(startServer()).rejects.toThrow('init boom');
  });

  test('startServer success uses app.listen and returns server', async () => {
    const serverMod = require('../server');
    const { app, startServer, applicationService } = serverMod;
    // ensure not initialized
    app.locals.initialized = false;
    jest.spyOn(applicationService, 'initialize').mockResolvedValue();

    const close = jest.fn();
    const listenSpy = jest.spyOn(app, 'listen').mockImplementation((port, cb) => {
      if (cb) cb();
      return { close };
    });

    const srv = await startServer();
    expect(listenSpy).toHaveBeenCalledTimes(1);
    expect(typeof srv.close).toBe('function');
  });
});
