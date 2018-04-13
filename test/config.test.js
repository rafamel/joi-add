const id = (n) => `[${String(n)}] `;
const Joi = require('joi');
const config = require('../src/config');

function getTypes(joi) {
  const types = [];
  for (let key of Object.keys(joi)) {
    if (typeof joi[key] !== 'function') continue;
    try {
      const item = joi[key]();
      if (
        item.hasOwnProperty('_type') &&
        // Exclude aliases
        key !== 'bool' &&
        key !== 'alt' &&
        // Exclude alternatives
        key !== 'alternatives'
      ) {
        types.push(key);
      }
    } catch (e) {}
  }
  return types.filter((x, i, arr) => arr.indexOf(x) === i);
}

describe(`- Types has all Joi types`, () => {
  const all = getTypes(Joi).sort();
  const scalars = all.filter((x) => ['array', 'object'].indexOf(x) === -1);

  test(id(1) + `scalars`, () => {
    expect(config.types.scalars.sort()).toEqual(scalars);
  });
  test(id(2) + `all`, () => {
    expect(config.types.all.sort()).toEqual(all);
  });
});
