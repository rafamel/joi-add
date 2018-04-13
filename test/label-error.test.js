const id = (n) => `[${String(n)}] `;
const config = require('../src/config');
const Joi = require('../src')(require('joi'));

describe(`- addLabel()`, () => {
  describe(`- Exists for types`, () => {
    test(id(1) + `Takes right input`, () => {
      config.types.all.forEach((type) => {
        expect(() => Joi[type]().addLabel('Some')).not.toThrow();
      });
    });
    test(id(2) + `Throws`, () => {
      expect(() => Joi.any().addLabel(5)).toThrow();
      expect(() => Joi.any().addLabel({})).toThrow();
    });
  });

  describe(`- Scalar labeling`, () => {
    test(id(1) + `no addLabel`, () => {
      const val = Joi.number()
        .min(5)
        .label('labelA');
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).not.toHaveProperty('addLabel');
      expect(error.details[0].context).toHaveProperty('label', 'labelA');
    });
    test(id(2) + `Sets label & addLabel`, () => {
      const val = Joi.number()
        .min(5)
        .addLabel('labelA');
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).toHaveProperty('addLabel', 'labelA');
      expect(error.details[0].context).toHaveProperty('label', 'labelA');
    });
    test(id(3) + `Last label has priority`, () => {
      const val = Joi.number()
        .min(5)
        .addLabel('labelB')
        .addLabel('labelA');
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).toHaveProperty('addLabel', 'labelA');
      expect(error.details[0].context).toHaveProperty('label', 'labelA');
    });
    test(
      id(4) + `addLabel does not exist if .label() has been later used`,
      () => {
        const val = Joi.number()
          .min(5)
          .addLabel('labelB')
          .label('labelA');
        const { error } = Joi.validate(2, val);

        expect(error.details[0].context).not.toHaveProperty('addLabel');
        expect(error.details[0].context).toHaveProperty('label', 'labelA');
      }
    );
    test(id(5) + `addLabel dissapears when using any.error()`, () => {
      const val = Joi.number()
        .min(5)
        .addLabel('labelA')
        .error((x) => x);
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).not.toHaveProperty('addLabel');
      expect(error.details[0].context).toHaveProperty('label', 'labelA');
    });
    test(id(6) + `addLabel persists when using .onError()`, () => {
      const val = Joi.number()
        .min(5)
        .addLabel('labelA')
        .onError((x) => x);
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).toHaveProperty('addLabel', 'labelA');
      expect(error.details[0].context).toHaveProperty('label', 'labelA');
    });
  });

  describe(`- Object labeling`, () => {
    const val = Joi.object()
      .addLabel('A')
      .keys({
        b: Joi.number()
          .min(10)
          .addLabel('B')
      });
    test(id(1) + `Proper label is present when the object fails`, () => {
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).toHaveProperty('addLabel', 'A');
      expect(error.details[0].context).toHaveProperty('label', 'A');
    });
    test(id(2) + `Proper label is present when object key fails`, () => {
      const { error } = Joi.validate({ b: 2 }, val);

      expect(error.details[0].context).toHaveProperty('addLabel', 'B');
      expect(error.details[0].context).toHaveProperty('label', 'B');
    });
  });
});

describe(`- onError()`, () => {
  describe(`- Exists for types`, () => {
    test(id(1) + `Takes right input`, () => {
      config.types.all.forEach((type) => {
        expect(() => Joi[type]().onError(() => {})).not.toThrow();
      });
    });
    test(id(2) + `Throws`, () => {
      expect(() => Joi.any().onError({})).toThrow();
      expect(() => Joi.any().onError('')).toThrow();
      expect(() => Joi.any().onError(5)).toThrow();
      expect(() => Joi.any().onError(Error())).toThrow();
    });
  });

  describe(`- Works`, () => {
    test(id(1) + `Basic case`, () => {
      const val = Joi.number()
        .min(10)
        .onError((errs) => {
          errs.forEach((err) => {
            err.context.changed = true;
          });
          return errs;
        });
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).toHaveProperty('changed', true);
    });
    test(id(2) + `With addLabel`, () => {
      const val = Joi.number()
        .min(10)
        .addLabel('B')
        .addLabel('A')
        .onError((x) => x)
        .onError((errs) => {
          errs.forEach((err) => {
            err.context.changed = true;
          });
          return errs;
        });
      const { error } = Joi.validate(2, val);

      expect(error.details[0].context).toHaveProperty('addLabel', 'A');
      expect(error.details[0].context).toHaveProperty('label', 'A');
      expect(error.details[0].context).toHaveProperty('changed', true);
    });
  });
});
