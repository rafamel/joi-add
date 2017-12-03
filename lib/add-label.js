'use strict';

module.exports = function (params) {
    return this.label(params.label).error((errs) => {
        errs.forEach((err) => {
            if (err.hasOwnProperty('context')
                && err.context.label === params.label) {
                err.context.addLabel = params.label;
            }
        });
        return (params.cb) ? params.cb(errs) : errs;
    });
};
