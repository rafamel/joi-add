const id = (n) => `[${String(n)}] `;
const Joi = require('joi');

describe(`- Test Joi api in use by joi-add`, () => {
  describe(`- Joi.validate() ({value, error})`, () => {
    const validation = Joi.validate(5, Joi.string());
    test(id(1) + `Exist`, () => {
      expect(validation).toHaveProperty('value', 5);
      expect(validation).toHaveProperty('error');
      expect(validation.error).not.toBe(null);
      expect(validation.error).toBeInstanceOf(Error);
    });
    test(id(2) + `Output error structure`, () => {
      const error = validation.error;
      expect(error).toHaveProperty('details');
      expect(Array.isArray(error.details)).toBe(true);
    });
    test(id(3) + `Output error structure (details)`, () => {
      const details = validation.error.details[0];
      expect(details).toHaveProperty('message');
      expect(details).toHaveProperty('path');
      expect(details).toHaveProperty('type');
      expect(details).toHaveProperty('context');
    });
    test(id(4) + `Output error structure (details.context)`, () => {
      const context = validation.error.details[0].context;
      expect(context).toHaveProperty('key', undefined);
      expect(context).toHaveProperty('label', 'value');
    });
  });
  describe(`- Joi.validate() options`, () => {
    test(id(1) + `abortEarly`, () => {
      const noEarly = Joi.validate(
        5.5,
        Joi.number()
          .integer()
          .max(4),
        { abortEarly: false }
      );
      const early = Joi.validate(
        5.5,
        Joi.number()
          .integer()
          .max(4),
        { abortEarly: true }
      );

      expect(noEarly.error.details.length).toBe(2);
      expect(early.error.details.length).toBe(1);
    });
    test(id(2) + `language.key`, () => {
      const emptykey = Joi.validate(5, Joi.string(), { language: { key: '' } });
      const defaults = Joi.validate(5, Joi.string());
      expect(defaults.error.message).toBe('"value" ' + emptykey.error.message);
    });
  });
});
