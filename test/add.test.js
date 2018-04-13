const id = (n) => `[${String(n)}] `;
const config = require('../src/config');
const Joi = require('../src')(require('joi'));

describe(`- Exists for types`, () => {
  test(id(1) + `Exists for scalars`, () => {
    config.types.scalars.forEach((type) => {
      expect(() => Joi[type]().add(Joi.any())).not.toThrow();
    });
  });
  test(id(2) + `Doesn't exist for non scalars`, () => {
    const nonScalars = config.types.all.filter(
      (x) => config.types.scalars.indexOf(x) === -1
    );
    nonScalars.forEach((type) => {
      expect(() => Joi[type]().add(Joi.any())).toThrow();
    });
  });
});

describe(`- Takes right input`, () => {
  test(id(1) + `Takes joi schema or function`, () => {
    expect(() => Joi.any().add(Joi.any())).not.toThrow();
    expect(() => Joi.any().add(() => {})).not.toThrow();
  });
  test(id(2) + `Takes message`, () => {
    expect(() => Joi.any().add(Joi.any(), 'Message')).not.toThrow();
    expect(() => Joi.any().add(() => {}, 'Message')).not.toThrow();
  });
  test(id(3) + `Throws on wrong input`, () => {
    expect(() => Joi.any().add(5)).toThrow();
    expect(() => Joi.any().add('')).toThrow();
    expect(() => Joi.any().add({})).toThrow();
    expect(() => Joi.any().add(() => {}, 5)).toThrow();
    expect(() => Joi.any().add(() => {}, {})).toThrow();
  });
});

describe(`- Joi schema`, () => {
  test(id(1) + `Basic case`, () => {
    const val = Joi.any().add(Joi.string());
    expect(Joi.validate(5, val).error).toBeInstanceOf(Error);
    expect(Joi.validate('str', val).error).toBe(null);
  });
  test(id(2) + `Multiple`, () => {
    const val = Joi.any()
      .add(Joi.string().min(2))
      .add(Joi.string().max(5));
    expect(Joi.validate('1', val).error).toBeInstanceOf(Error);
    expect(Joi.validate('123456', val).error).toBeInstanceOf(Error);
    expect(Joi.validate('123', val).error).toBe(null);
  });
});

describe(`- Joi schema returning functions`, () => {
  test(id(1) + `Basic case`, () => {
    const val = Joi.any().add(() => Joi.string());
    expect(Joi.validate(5, val).error).toBeInstanceOf(Error);
    expect(Joi.validate('str', val).error).toBe(null);
  });
  test(
    id(2) + `When taking function, throws when validating if not a Joi schema`,
    () => {
      expect(() =>
        Joi.validate('', Joi.any().add(() => Joi.string()))
      ).not.toThrow();
      expect(() => Joi.validate('', Joi.any().add(() => null))).toThrow(
        'The function passed to .add() must return a Joi schema.'
      );
      expect(() => Joi.validate('', Joi.any().add(() => {}))).toThrow();
      expect(() => Joi.validate('', Joi.any().add(() => ({})))).toThrow();
    }
  );
  test(id(3) + `When taking function, schema as first arg`, () => {
    const val = Joi.number().add((it) => it.max(5));
    expect(Joi.validate(6, val).error).toBeInstanceOf(Error);
    expect(Joi.validate(4, val).error).toBe(null);
  });
});

describe(`- Options are preserved on inner validation`, () => {
  test(id(1), () => {
    const val = Joi.any().add(Joi.number());
    const { error: errorA } = Joi.validate('5', val, { convert: false });
    const { error: errorB } = Joi.validate('5', val, { convert: true });

    expect(errorA).toBeInstanceOf(Error);
    expect(errorB).toBe(null);
  });
});

describe(`- Label inheritance & Error structure`, () => {
  test(id(1) + `Inner & Outer label`, () => {
    const valInner = Joi.string().add((it) => it.min(5).label('Ex'));
    const valOuter = Joi.string()
      .add((it) => it.min(5))
      .label('Ex');
    const errors = [
      Joi.validate('str', valInner),
      Joi.validate('str', valOuter)
    ].map((x) => x.error);

    errors.forEach((error) => {
      expect(error.details[0].type).toBe(`string.add`);
      expect(error.message).toBe(
        `"Ex" length must be at least 5 characters long`
      );
      expect(error.details[0].message).toBe(
        `"Ex" length must be at least 5 characters long`
      );
      expect(error.details[0].context.message).toBe(
        `length must be at least 5 characters long`
      );
      expect(error.details[0].context.key).toBe(undefined);
      expect(error.details[0].context.label).toBe('Ex');
      expect(error.details[0].context.value).toBe('str');
    });
  });
  test(id(2) + `Proper label depending on error`, () => {
    const val = Joi.number()
      .add((it) => it.min(4).label('labelA'))
      .add((it) => it.max(8).label('labelB'));
    const { error: errorA } = Joi.validate(2, val);
    const { error: errorB } = Joi.validate(10, val);

    expect(errorA.message).toContain('labelA');
    expect(errorA.message).not.toContain('labelB');

    expect(errorB.message).toContain('labelB');
    expect(errorB.message).not.toContain('labelA');
  });
  test(id(3) + `Inner label precedence`, () => {
    const val = Joi.number()
      .add((it) => it.min(4).label('labelA'))
      .add((it) => it.max(8))
      .label('labelB');
    const { error: errorA } = Joi.validate(2, val);
    const { error: errorB } = Joi.validate(10, val);

    expect(errorA.message).toContain('labelA');
    expect(errorA.message).not.toContain('labelB');

    expect(errorB.message).toContain('labelB');
    expect(errorB.message).not.toContain('labelA');
  });
  test(id(4) + `Inner label precedence when root label is different`, () => {
    const val = Joi.number()
      .add((it) => it.min(4).label('labelA'))
      .add((it) => it.max(8));
    const opts = { language: { root: 'rootLabel' } };
    const { error: errorA } = Joi.validate(2, val, opts);
    const { error: errorB } = Joi.validate(10, val, opts);

    expect(errorA.message).toContain('labelA');
    expect(errorA.message).not.toContain('rootLabel');

    expect(errorB.message).toContain('rootLabel');
    expect(errorB.message).not.toContain('labelA');
  });
});

describe(`- Custom message`, () => {
  test(id(1), () => {
    const val = Joi.number()
      .add((it) => it.min(4).label('labelA'), 'Such an error')
      .add((it) => it.max(8))
      .label('labelB');
    const { error: errorA } = Joi.validate(2, val);
    const { error: errorB } = Joi.validate(10, val);

    expect(errorA.message).toBe('Such an error');
    expect(errorA.details[0].message).toBe('Such an error');
    expect(errorA.details[0].context).toHaveProperty('isExplicit', true);
    expect(errorA.message).not.toContain('labelA');

    expect(errorB.message).toContain('labelB');
    expect(errorB.message).not.toContain('Such an error');
    expect(errorB.details[0].context).not.toHaveProperty('isExplicit');
  });
});
