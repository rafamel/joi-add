const id = (n) => `[${String(n)}] `;
const config = require('../src/config');
const Joi = require('../src')(require('joi'));

test(id(1) + `Exists for all types`, () => {
  config.types.all.forEach((type) => {
    expect(() => Joi[type]().addFn(() => {})).not.toThrow();
  });
});

describe(`- Takes right input`, () => {
  test(id(1) + `Takes function`, () => {
    expect(() => Joi.any().addFn(() => {})).not.toThrow();
  });
  test(id(2) + `Takes message & noLabel`, () => {
    expect(() => Joi.any().addFn(() => {}, 'Message', true)).not.toThrow();
    expect(() => Joi.any().addFn(() => {}, 'Message', false)).not.toThrow();
  });
  test(id(3) + `Throws on wrong input`, () => {
    expect(() => Joi.any().addFn(Joi.any())).toThrow();
    expect(() => Joi.any().addFn(5)).toThrow();
    expect(() => Joi.any().addFn('')).toThrow();
    expect(() => Joi.any().addFn({})).toThrow();
    expect(() => Joi.any().addFn(() => {}, 6)).toThrow();
    expect(() => Joi.any().addFn(() => {}, {})).toThrow();
    expect(() => Joi.any().addFn(() => {}, 'Str', {})).toThrow();
    expect(() => Joi.any().addFn(() => {}, 'Str', 5)).toThrow();
  });
});
describe(`- Basic`, () => {
  test(id(1) + `Error when false`, () => {
    const val = Joi.number().addFn(() => false);
    const { error } = Joi.validate(1, val);

    expect(error).toBeInstanceOf(Error);
  });
  test(id(2) + `No error when true`, () => {
    const val = Joi.number().addFn(() => true);
    const { error } = Joi.validate(1, val);

    expect(error).toBe(null);
  });
  test(id(3) + `Receives value`, () => {
    const val = Joi.number().addFn((val) => val === 5);
    const { error } = Joi.validate(5, val);

    expect(error).toBe(null);
  });
});
describe(`- Message & noKey & isExplicit`, () => {
  test(id(1) + `Defaults to noKey = true when message`, () => {
    const val = Joi.number()
      .addFn(() => false, 'Some message')
      .label('Some');
    const { error } = Joi.validate(1, val);

    expect(error.details[0].message).toBe('Some message');
    expect(error.details[0].context).toHaveProperty('isExplicit', true);
  });
  test(id(2) + `Defaults to noKey = false when no message`, () => {
    const val = Joi.number()
      .addFn(() => false)
      .label('Some');
    const { error } = Joi.validate(1, val);

    expect(error.details[0].message).toBe('"Some" didn\'t pass');
    expect(error.details[0].context).not.toHaveProperty('isExplicit');
  });
  test(id(3) + `Message + noKey = false`, () => {
    const val = Joi.number()
      .addFn(() => false, 'Some message', false)
      .label('Some');
    const { error } = Joi.validate(1, val);

    expect(error.details[0].message).toBe('"Some" Some message');
    expect(error.details[0].context).toHaveProperty('isExplicit', true);
  });
  test(id(4) + `No message + noKey = true`, () => {
    const val = Joi.number()
      .addFn(() => false, null, true)
      .label('Some');
    const { error } = Joi.validate(1, val);

    expect(error.details[0].message).toBe("didn't pass");
    expect(error.details[0].context).not.toHaveProperty('isExplicit');
  });
});
