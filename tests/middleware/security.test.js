const request = require('supertest');
const express = require('express');
const session = require('express-session');
const {
  csrfProtection,
  securityHeaders,
  robotsNoindexHeader,
  sanitizeInput
} = require('../../middleware/security');

describe('sanitizeInput middleware', () => {
  test('escapes HTML in body recursively', () => {
    const req = {
      body: { a: '<script>x</script>', nested: { b: '<b>bold</b>' } },
      query: {},
      params: {}
    };
    const res = {};

    console.log('BEFORE sanitizeInput:', JSON.stringify(req.body));
    sanitizeInput(req, res, () => {});

    console.log('AFTER sanitizeInput:', JSON.stringify(req.body));
    expect(req.body.a).toBe('&#x3C;script&#x3E;x&#x3C;/script&#x3E;');
    expect(req.body.nested.b).toBe('&#x3C;b&#x3E;bold&#x3C;/b&#x3E;');
  });

  test('leaves non-string values intact', () => {
    const obj = { num: 1, bool: true, arr: [1, 2], nested: { val: '<x>' } };
    const req = { body: obj, query: {}, params: {} };

    console.log('BEFORE sanitizeInput:', JSON.stringify(req.body));
    sanitizeInput(req, {}, () => {});

    console.log('AFTER sanitizeInput:', JSON.stringify(req.body));
    expect(req.body.num).toBe(1);
    expect(req.body.nested.val).toBe('&#x3C;x&#x3E;');
  });
});

describe('Security Middleware', () => {
  it('sets security headers', async () => {
    const app = express();
    app.use(securityHeaders);
    app.use(robotsNoindexHeader);
    app.get('/test-headers', (req, res) => res.send('ok'));
    const res = await request(app).get('/test-headers');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
  });

  it('provides CSRF token on GET', async () => {
    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
    app.use(express.urlencoded({ extended: true }));
    app.get('/csrf-form', csrfProtection, (req, res) => {
      res.status(200).json({ csrfToken: res.locals.csrfToken });
    });
    const res = await request(app).get('/csrf-form');
    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
  });

  it('accepts valid CSRF token on POST', async () => {
    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
    app.use(express.urlencoded({ extended: true }));
    app.get('/csrf-form', csrfProtection, (req, res) => {
      res.status(200).json({ csrfToken: res.locals.csrfToken });
    });
    app.post('/csrf-form', csrfProtection, (req, res) => {
      res.status(200).send('CSRF OK');
    });
    const agent = request.agent(app);
    const getRes = await agent.get('/csrf-form');
    const token = getRes.body.csrfToken;
    const postRes = await agent
      .post('/csrf-form')
      .send(`_csrf=${token}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');
    expect(postRes.status).toBe(200);
    expect(postRes.text).toBe('CSRF OK');
  });

  it('rejects invalid CSRF token on POST', async () => {
    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
    app.use(express.urlencoded({ extended: true }));
    app.get('/csrf-form', csrfProtection, (req, res) => {
      res.status(200).json({ csrfToken: res.locals.csrfToken });
    });
    app.post('/csrf-form', csrfProtection, (req, res) => {
      res.status(200).send('CSRF OK');
    });
    const agent = request.agent(app);
    await agent.get('/csrf-form'); // establish session
    const postRes = await agent
      .post('/csrf-form')
      .send('_csrf=badtoken')
      .set('Content-Type', 'application/x-www-form-urlencoded');
    expect(postRes.status).toBe(403);
    expect(postRes.text).toMatch(/invalid csrf token/i);
  });
});
