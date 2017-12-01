'use strict';
const config = require('./config');
const add = require('./add');

function extendJoi(joi) {
    for (let type of config.types) {
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
                    validate: add(joi, type)
                }
            ]
        }));
    }
    return joi;
}

module.exports = (joi) => {
    return extendJoi(joi);
};
