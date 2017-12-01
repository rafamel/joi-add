'use strict';
const Joi = require('joi');
const config = require('../lib/config');

const id = (n) => `[${ String(n) }] `;

function getTypes(joi) {
    const types = [];
    for (let key of Object.keys(joi)) {
        if (typeof joi[key] !== 'function') continue;
        try {
            const item = joi[key]();
            if (item.hasOwnProperty('_type')
                // Exclude aliases
                && key !== 'bool'
                && key !== 'alt'
            ) {
                types.push(key);
            }
        } catch (e) { }
    }
    return types.filter((x, i, arr) => arr.indexOf(x) === i);
};

describe(`- Types`, () => {
    test.only(id(1) + `Are all Joi types`, () => {
        expect(config.types.sort()).toEqual(getTypes(Joi).sort());
    });
});
