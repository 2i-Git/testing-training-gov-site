const { sanitizeInput } = require('../../middleware/security');

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
