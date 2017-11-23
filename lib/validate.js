'use strict';
const cloneDeep = require('lodash.clonedeep');

module.exports = function (joi, type) {
    return function validate(params, value, state, options) {
        let schema = params.schema;
        if (typeof schema === 'function') {
            schema = schema(joi[type]());
        }

        const opts = cloneDeep(options);
        if (!opts.hasOwnProperty('language')) opts.language = {};
        opts.language.key = '';
        const ans = joi.validate(value, schema, opts);
        if (ans.error) {
            console.log(ans.error.details[0]);
            const context = { v: value, message: ans.error.message };
            if (params.message) context.isExplicit = true;
            const err = this.createError(`${type}.add`, context, state, options);
            if (params.message) err.message = params.message;
            else if (type === 'object') err.message = ans.error.message
            return err;
        }
        return ans.value;
    };
}
