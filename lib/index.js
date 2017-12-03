'use strict';
const config = require('./config');
const add = require('./add');
const addFn = require('./add-fn');

function extendJoi(joi) {
    for (let type of config.types.scalars) {
        joi = joi.extend((joi) => ({
            base: joi[type](),
            name: type,
            language: {
                add: '{{!message}}',
                addFn: '{{!message}}'
            },
            rules: [
                {
                    name: 'add',
                    params: {
                        schema: joi.alternatives().try(joi.func(), joi.object().schema()),
                        message: joi.string()
                    },
                    validate: add(joi, type)
                },
                {
                    name: 'addFn',
                    params: {
                        fn: joi.func(),
                        message: joi.string().allow(null),
                        noKey: joi.boolean()
                    },
                    validate: addFn(joi, type)
                }
            ]
        }));
    }
    for (let type of config.types.nonScalars) {
        joi = joi.extend((joi) => ({
            base: joi[type](),
            name: type,
            language: {
                addFn: '{{!message}}'
            },
            rules: [
                {
                    name: 'addFn',
                    params: {
                        fn: joi.func(),
                        message: joi.string().allow(null),
                        noKey: joi.boolean()
                    },
                    validate: addFn(joi, type)
                }
            ]
        }));
    }

    return joi;
}

module.exports = (joi) => {
    return extendJoi(joi);
};
