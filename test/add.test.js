'use strict';
const config = require('../lib/config');
const baseJoi = require('joi');
const Joi = require('../lib')(baseJoi);

const id = (n) => `[${ String(n) }] `;

describe(`- .add() Basic`, () => {
    test(id(1) + `Exists`, () => {
        config.types.forEach(type => {
            expect(() => Joi[type]().add()).not.toThrow();
        });
    });
    test(id(2) + `Takes joi schema or function`, () => {
        expect(() => Joi.any().add(Joi.any())).not.toThrow();
        expect(() => Joi.any().add(() => {})).not.toThrow();

        expect(() => Joi.any().add(5)).toThrow();
        expect(() => Joi.any().add('')).toThrow();
        expect(() => Joi.any().add({})).toThrow();
    });
});

describe(`- .add() Joi schema`, () => {
    test(id(1) + `Basic case`, () => {
        const val = Joi.any().add(Joi.string());
        expect(Joi.validate(5, val).error)
            .toBeInstanceOf(Error);
        expect(Joi.validate('str', val).error)
            .toBe(null);
    });
    test(id(2) + `Multiple`, () => {
        const val = Joi.any().add(Joi.string().min(2)).add(Joi.string().max(5));
        expect(Joi.validate('1', val).error)
            .toBeInstanceOf(Error);
        expect(Joi.validate('123456', val).error)
            .toBeInstanceOf(Error);
        expect(Joi.validate('123', val).error)
            .toBe(null);
    });
});

describe(`- .add() Joi schema returning functions`, () => {
    test(id(1) + `Basic case`, () => {
        const val = Joi.any().add(() => Joi.string());
        expect(Joi.validate(5, val).error)
            .toBeInstanceOf(Error);
        expect(Joi.validate('str', val).error)
            .toBe(null);
    });
    test(id(2) + `When taking function, throws when validating if not a Joi schema`, () => {
        expect(() => Joi.validate('', Joi.any().add(() => Joi.string()))).not.toThrow();
        expect(() => Joi.validate('', Joi.any().add(() => null))).toThrow('The function passed to .add() must return a Joi schema.');
        expect(() => Joi.validate('', Joi.any().add(() => {}))).toThrow();
        expect(() => Joi.validate('', Joi.any().add(() => ({})))).toThrow();
    });
    test(id(3) + `When taking function, schema as first arg`, () => {
        const val = Joi.number().add((it) => it.max(5));
        expect(Joi.validate(6, val).error)
            .toBeInstanceOf(Error);
        expect(Joi.validate(4, val).error)
            .toBe(null);
    });
});

describe(`- .add() Path and middle keys`, () => {
    const val = Joi.object().keys({
        some: Joi.object()
            .add((it) => it.keys({
                other: Joi.object().keys({
                    more: Joi.number().max(5)
                })
            }))
    });

    test(id(1) + `Middle keys are lost`, () => {
        const { error } = Joi.validate({ some: { other: { more: 6 } } }, val);

        expect(error.details[0].type).toBe(`object.add`);
        expect(error.details[0].message).toContain('more');
        expect(error.details[0].message).not.toContain('other');
        expect(error.details[0].context.message).not.toContain('more');
        expect(error.message).toContain('more');
        expect(error.message).not.toContain('other');
        expect(error.message).toContain('some');
    });
    test(id(2) + `Full path`, () => {
        const { error } = Joi.validate({ some: { other: { more: 6 } } }, val);

        expect(error.details[0].path).toEqual(['some', 'other', 'more']);
    });
});

describe(`- .add() Options are preserved on inner validation`, () => {
    test(id(1), () => {
        const val = Joi.any().add(Joi.number());
        const { error: errorA } = Joi.validate('5', val, { convert: false });
        const { error: errorB } = Joi.validate('5', val, { convert: true });

        expect(errorA).toBeInstanceOf(Error);
        expect(errorB).toBe(null);
    });
});

describe(`- .add() Label inheritance & Error structure`, () => {
    test(id(1) + `Single: Inner & Outer label`, () => {
        const valInner = Joi.string().add((it) => it.min(5).label('Ex'));
        const valOuter = Joi.string().add((it) => it.min(5)).label('Ex');
        const errors = [
            Joi.validate('str', valInner),
            Joi.validate('str', valOuter)
        ].map(x => x.error);

        errors.forEach(error => {
            expect(error.details[0].type).toBe(`string.add`);
            expect(error.message).toBe(`"Ex" length must be at least 5 characters long`);
            expect(error.details[0].message).toBe(`"Ex" length must be at least 5 characters long`);
            expect(error.details[0].context.message).toBe(`length must be at least 5 characters long`);
            expect(error.details[0].context.key).toBe(undefined);
            expect(error.details[0].context.label).toBe('Ex');
            expect(error.details[0].context.value).toBe('str');
        });
    });
    test(id(2) + `Single: Proper label depending on error`, () => {
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
    test(id(3) + `Single: Inner label precedence`, () => {
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
    test(id(4) + `Single: Inner label precedence when root label is different`, () => {
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
    test(id(5) + `Object labels: middle labels are lost; outer and innermost preserved`, () => {
        const val = Joi.object().keys({
            some: Joi.object()
                .add((it) => it.keys({
                    other: Joi.object().keys({
                        more: Joi.number().max(5).label('Ex1')
                    }).label('Ex2')
                }))
                .label('Ex3')
        });
        const { error } = Joi.validate({ some: { other: { more: 6 } } }, val);

        expect(error.details[0].type).toBe(`object.add`);
        expect(error.details[0].message).toContain('Ex1');
        expect(error.details[0].context.message).not.toContain('Ex1');
        expect(error.message).toContain('Ex3');
        expect(error.message).not.toContain('some');
        expect(error.message).not.toContain('Ex2');
        expect(error.message).not.toContain('other');
        expect(error.message).toContain('Ex1');
        expect(error.message).not.toContain('more');
    });
});

describe(`- .add() Custom message`, () => {
    test(id(1) + `Single`, () => {
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
    test(id(2) + `Object`, () => {
        const val = Joi.object().keys({
            some: Joi.number()
                .add((it) => it.max(5), 'Such an error')
        });
        const { error } = Joi.validate({ some: 10 }, val);

        expect(error.message).not.toBe('Such an error');
        expect(error.message).toContain('Such an error');
        expect(error.details[0].message).toBe('Such an error');
        expect(error.details[0].context).toHaveProperty('isExplicit', true);
    });
});
