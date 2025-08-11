const { sanitizeInput } = require('../../middleware/security');

describe('sanitizeInput middleware', () => {
  test('escapes HTML in body recursively', () => {
    const req = {
      body: { a: '<script>x</script>', nested: { b: '<b>bold</b>' } },
      query: {},
      params: {}
    };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.a).toBe('&lt;script&gt;x&lt;&#x2F;script&gt;');
    expect(req.body.nested.b).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
  });

  test('leaves non-string values intact', () => {
    const obj = { num: 1, bool: true, arr: [1, 2], nested: { val: '<x>' } };
    const req = { body: obj, query: {}, params: {} };
    sanitizeInput(req, {}, () => {});
    expect(req.body.num).toBe(1);
    expect(req.body.nested.val).toBe('&lt;x&gt;');
  });
});
