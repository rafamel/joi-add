'use strict';
const cloneDeep = require('lodash.clonedeep');
const validate = require('./validate');

function getTypes(joi) {
    const types = [];
    for (let key of Object.keys(joi)) {
        if (typeof joi[key] !== 'function') continue;
        try {
            const item = joi[key]();
            if (item.hasOwnProperty('_type')) {
                types.push(item._type);
            }
        } catch (e) { }
    }
    return types;
}

function extendJoi(joi, opts) {
    const types = getTypes(joi);
    const ans = [];
    for (let type of types) {
        joi = joi.extend((joi) => ({
            base: joi[type](),
            name: type,
            language: {
                add: '{{!message}}'
            },
            rules: [
                {
                    name: 'add',
                    params: {
                        schema: joi.alternatives().try(joi.func(), joi.object().schema()),
                        message: joi.string()
                    },
                    validate: validate(joi, type, opts)
                }
            ]
        }));
    }
    return joi;
}

module.exports = (joi, opts = {}) => {
    // joi.object().keys({
    //     inheritType: joi.boolean().default(false)
    // });
    // todo validate opts & document
    return extendJoi(joi, opts);
}
