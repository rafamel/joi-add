module.exports = function(joi, type) {
  return function validate(params, value, state, options) {
    const ans = Boolean(params.fn(value, options));

    // Test passes if true
    if (ans) return value;

    // Test fails if false
    let message, noKey;
    if (params.message) {
      message = params.message;
      // eslint-disable-next-line
      noKey = params.noKey == undefined ? true : params.noKey;
    } else {
      message = `didn't pass`;
      noKey = params.noKey || false;
    }
    const error = this.createError(
      `${type}.addFn`,
      { message },
      state,
      options
    );
    if (params.message) error.context.isExplicit = true;
    if (noKey) error.message = message;
    return error;
  };
};
