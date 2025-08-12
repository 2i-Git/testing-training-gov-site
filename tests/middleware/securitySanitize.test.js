const { sanitizeInput } = require('../../middleware/security');

describe('sanitizeInput removal/arrays', () => {
  test('sanitizes query and params as well as body', () => {
    const req = {
      body: { k: '<i>x</i>' },
      query: { q: '<svg onload=1>' },
      params: { id: '<b>1</b>' }
    };
    sanitizeInput(req, {}, () => {});
    expect(req.body.k).toBe('&lt;i&gt;x&lt;&#x2F;i&gt;');
    expect(req.query.q).toBe('&lt;svg onload=1&gt;');
    expect(req.params.id).toBe('&lt;b&gt;1&lt;&#x2F;b&gt;');
  });

  test('sanitizes arrays of strings', () => {
    const req = {
      body: { list: ['<a>', 'ok', '<b>'] },
      query: {},
      params: {}
    };
    sanitizeInput(req, {}, () => {});
    expect(req.body.list).toEqual(['&lt;a&gt;', 'ok', '&lt;b&gt;']);
  });
});
