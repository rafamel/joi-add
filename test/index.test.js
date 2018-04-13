const id = (n) => `[${String(n)}] `;
const baseJoi = require('joi');

describe(`- Joi mixin persistence`, () => {
  test(id(1) + `Doesn't persist with persist = false`, () => {
    require('../src')(baseJoi, false);
    expect(() => require('../src')()).toThrow();
  });
  test(id(2) + `Persists with defaults on external require`, () => {
    require('./_setup/persistence');
    expect(() => require('../src')()).not.toThrow();
    expect(() => require('../src')().object()).not.toThrow();
  });
  test(id(3) + `Persists with persist = true`, () => {
    require('../src')(baseJoi, true);
    expect(() => require('../src')()).not.toThrow();
    expect(() => require('../src')().object()).not.toThrow();
  });
});
