const { sanitizeInput } = require('../../middleware/security');

describe('sanitizeInput removal/arrays', () => {
  test('sanitizes query and params as well as body', () => {
    const req = {
      body: { k: '<i>x</i>' },
      query: { q: '<svg onload=1>' },
      params: { id: '<b>1</b>' }
    };
    sanitizeInput(req, {}, () => {});
    expect(req.body.k).toBe('&#x3C;i&#x3E;x&#x3C;/i&#x3E;');
    expect(req.query.q).toBe('&#x3C;svg onload=1&#x3E;');
    expect(req.params.id).toBe('&#x3C;b&#x3E;1&#x3C;/b&#x3E;');
  });

  test('sanitizes arrays of strings', () => {
    const req = {
      body: { list: ['<a>', 'ok', '<b>'] },
      query: {},
      params: {}
    };
    sanitizeInput(req, {}, () => {});
    expect(req.body.list).toEqual(['&#x3C;a&#x3E;', 'ok', '&#x3C;b&#x3E;']);
  });
});
