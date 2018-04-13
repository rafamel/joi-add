function run(errs, cb) {
  const addLabel = this._flags.addLabel;
  if (addLabel) {
    errs.forEach((err) => {
      if (err.hasOwnProperty('context') && err.context.label === addLabel) {
        err.context.addLabel = addLabel;
      }
    });
  }
  return cb ? cb(errs) : errs;
}

module.exports = {
  addLabel(params) {
    this._flags.addLabel = params.label;
    return this.label(params.label).error((errs) => run.call(this, errs));
  },
  onError(params) {
    return this.error((errs) => run.call(this, errs, params.cb));
  }
};
