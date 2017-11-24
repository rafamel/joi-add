'use strict';
const cloneDeep = require('lodash.clonedeep');
const merge = require('lodash.merge');

module.exports = function (joi, type, extOpts) {
    return function validate(params, value, state, options) {
        // Prepare schema if function
        let schema = params.schema;
        if (typeof schema === 'function') {
            schema = schema(joi[type]());
        }

        // Clone validation options and ensure abortEarly // todo document
        const opts = cloneDeep(options);
        opts.abortEarly = true;
        if (!opts.language) opts.language = {};
        opts.language.key = '';

        const ans = joi.validate(value, schema, opts);
        if (ans.error) {
            const rootLabel = (opts.language) ? (opts.language.root || 'value') : 'value';

            const err = {};
            err.old = ans.error.details[0];
            err.new = this.createError(
                (extOpts.inheritType) ? err.old.type : `${type}.add`,
                { message: err.old.message },
                state,
                options
            );

            err.new.path = (err.new.path || []).concat(err.old.path || []);

            if (err.old.context.label === rootLabel) delete err.old.context.label;
            err.new.context = merge(err.new.context, err.old.context);
            if (params.message) err.new.message = params.message;

            return err.new;
        }
        return ans.value;
    };
}
