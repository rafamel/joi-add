'use strict';
const baseJoi = require('joi');

const id = (n) => `[${ String(n) }] `;

describe(`- Joi mixin persistence`, () => {
    test(id(1) + `Doesn't persist with persist = false`, () => {
        require('../lib')(baseJoi, false);
        expect(() => require('../lib')()).toThrow();
    });
    test(id(2) + `Persists with defaults on external require`, () => {
        require('./setup/persistence');
        expect(() => require('../lib')()).not.toThrow();
        expect(() => require('../lib')().object()).not.toThrow();
    });
    test(id(3) + `Persists with persist = true`, () => {
        require('../lib')(baseJoi, true);
        expect(() => require('../lib')()).not.toThrow();
        expect(() => require('../lib')().object()).not.toThrow();
    });
});
