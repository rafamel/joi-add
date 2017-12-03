'use strict';
const config = require('../lib/config');
const Joi = require('../lib')(require('joi'));

const id = (n) => `[${ String(n) }] `;

describe(`- .addLabel()`, () => {
    describe(`- Exists for types`, () => {
        test(id(1), () => {
            config.types.all.forEach(type => {
                expect(() => Joi[type]().addLabel('Some')).not.toThrow();
            });
        });
    });

    describe(`- Takes right input`, () => {
        test(id(1) + `Passes`, () => {
            expect(() => Joi.any().addLabel('Some')).not.toThrow();
            expect(() => Joi.any().addLabel('Some', () => {})).not.toThrow();
        });
        test(id(2) + `Throws`, () => {
            expect(() => Joi.any().addLabel(5)).toThrow();
            expect(() => Joi.any().addLabel({})).toThrow();
            expect(() => Joi.any().addLabel('Some', {})).toThrow();
            expect(() => Joi.any().addLabel('Some', '')).toThrow();
            expect(() => Joi.any().addLabel('Some', 5)).toThrow();
            expect(() => Joi.any().addLabel('Some', Error())).toThrow();
        });
    });

    describe(`- Scalar labeling`, () => {
        test(id(1) + `no addLabel`, () => {
            const val = Joi.number().min(5).label('labelA');
            const { error } = Joi.validate(2, val);

            expect(error.details[0].context).not.toHaveProperty('addLabel');
            expect(error.details[0].context).toHaveProperty('label', 'labelA');
        });
        test(id(2) + `Sets label & addLabel`, () => {
            const val = Joi.number().min(5).addLabel('labelA');
            const { error } = Joi.validate(2, val);

            expect(error.details[0].context).toHaveProperty('addLabel', 'labelA');
            expect(error.details[0].context).toHaveProperty('label', 'labelA');
        });
        test(id(3) + `addLabel dissapears when using any.error()`, () => {
            const val = Joi.number().min(5).addLabel('labelA').error(x => x);
            const { error } = Joi.validate(2, val);

            expect(error.details[0].context).not.toHaveProperty('addLabel');
            expect(error.details[0].context).toHaveProperty('label', 'labelA');
        });
    });

    describe(`- Object labeling`, () => {
        const val = Joi.object().addLabel('A').keys({
            b: Joi.number().min(10).addLabel('B')
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

    describe(`- Callback`, () => {
        test(id(1), () => {
            const val = Joi.number().min(10).addLabel('A', (errs) => {
                errs.forEach(err => {
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
