'use strict';
const config = require('./config');
const add = require('./add');
const addFn = require('./add-fn');
const { addLabel, onError } = require('./label-error');

function extendJoi(joi) {
    for (let type of config.types.scalars) {
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
                        schema: joi.alternatives().try(
                            joi.func(),
                            joi.object().schema()
                        ).required(),
                        message: joi.string()
                    },
                    validate: add(joi, type)
                }
            ]
        }));
    }
    for (let type of config.types.all) {
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
                        fn: joi.func().required(),
                        message: joi.string().allow(null),
                        noKey: joi.boolean()
                    },
                    validate: addFn(joi, type)
                },
                {
                    name: 'addLabel',
                    params: {
                        label: joi.string().min(1).required()
                    },
                    setup: addLabel
                },
                {
                    name: 'onError',
                    params: {
                        cb: joi.func()
                    },
                    setup: onError
                }
            ]
        }));
    }

    return joi;
}

let persistent;
module.exports = function (joi, persist = true) {
    if (!joi && persistent) return persistent;

    const ans = extendJoi(joi);
    persistent = (persist)
        ? ans
        : undefined;
    return ans;
};
