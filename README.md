# joi-add

[![Version](https://img.shields.io/github/package-json/v/rafamel/joi-add.svg)](https://github.com/rafamel/joi-add)
[![Build Status](https://travis-ci.org/rafamel/joi-add.svg)](https://travis-ci.org/rafamel/joi-add)
[![Coverage](https://img.shields.io/coveralls/rafamel/joi-add.svg)](https://coveralls.io/github/rafamel/joi-add)
[![Dependencies](https://david-dm.org/rafamel/joi-add/status.svg)](https://david-dm.org/rafamel/joi-add)
[![Vulnerabilities](https://snyk.io/test/npm/joi-add/badge.svg)](https://snyk.io/test/npm/joi-add)
[![Issues](https://img.shields.io/github/issues/rafamel/joi-add.svg)](https://github.com/rafamel/joi-add/issues)
[![License](https://img.shields.io/github/license/rafamel/joi-add.svg)](https://github.com/rafamel/joi-add/blob/master/LICENSE)

**Add and expand on previously defined [*Joi*](https://github.com/hapijs/joi/) schemas. Define check-specific error messages. Add custom function validations.**

## Install

[`npm install joi-add`](https://www.npmjs.com/package/joi-add)

## Why

With *joi-add* you can add custom function validations to *Joi* schemas, as well as customize the error message for any specific validation check, as the *Joi* API method [`any.error()`](https://github.com/hapijs/joi/blob/master/API.md#anyerrorerr) will affect all the checks for a key/value. This is particularly useful when validating requests on the server, as it allows us to offer meaningful error messages for distinct checks. The usage of *joi-add* with [*any.concat()*](https://github.com/hapijs/joi/blob/master/API.md#anyconcatschema) will allow for reusable, extensible schemas that produce meaningful error messages.

## Setup

Pass *Joi* to *joi-add*, like so:

```javascript
const baseJoi = require('joi');
const Joi = require('joi-add')(baseJoi);
```

If you're running an application, because of *Node.js*'s `require()` caching, you'll only need to pass *Joi* once. From then on, you can just do:

```javascript
const Joi = require('joi-add')();
```

If you don't want the base *Joi* you're passing to persist like above, you can do:

```javascript
const baseJoi = require('joi');
const Joi = require('joi-add')(baseJoi, false);
```

## Usage

### `.add(validation, message)`

*`add()` is available for all native **scalar** Joi types* - it's not for `Joi.array()`, `Joi.object()` and `Joi.alternatives()`.

- `validation`: *Joi* validation or *Joi* validation returning function.
- `message` (optional): *String.* Personalized error message.

#### Examples

An example of a simple use case with `validation` as a *Joi* validation would be:

```javascript
Joi.string()
    .add(
        Joi.string().regex(/^[a-zA-Z0-9_]+$/),
        'Username should only contain letters, numbers, and underscores (_).'
    );
```

If the validation fails, it would return a *Joi* [`ValidationError`](https://github.com/hapijs/joi/blob/master/API.md#errors) with message `'Username should only contain letters, numbers, and underscores (_).'`.

As with any other `ValidationError`, you can check its details in the error key `details` (which will be an array of all errors found). If the error message was explicitly added via *.add(),* the `context` property will have a `isExplicit` property as `true`. In our example, `error.details[0].context.isExplicit` would be `true`. In all other cases, `isExplicit` won't exist as a `context` property.

For ease of use, **`validation` can also be a function,** receiving *Joi* object with its type defined, and returning a Joi object too. As an example, this would be equivalent to the example above:

```javascript
Joi.string()
    .add(
        // `it` would be a Joi object of the same type,
        // therefore in this case, Joi.string()
        (it) => it.regex(/^[a-zA-Z0-9_]+$/),
        'Username should only contain letters, numbers, and underscores (_).'
    );
```

#### If the validation is within an *object* schema, the error message will show the full error path

As usual with *Joi*. As an example:

```javascript
Joi.object().keys({
    username: Joi.string()
        .add(
            (it) => it.regex(/^[a-zA-Z0-9_]+$/),
            'Username should only contain letters, numbers, and underscores (_).'
        )
});
```

With the [default `language` options](https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback), the error message here would be `'child "username" fails because [Username should only contain letters, numbers, and underscores (_).]'`. If you are looking to only show your custom error message, you can always catch the error and get the `error.details[0].message`, which will always be your custom message, if it exists, or the *Joi* generated error for the specific key/value that failed.

#### Only the first inner error will be in the error array (`error.details`)

If more than one validations fail within the same `.add()`, only the first one be present in the `error.details` array. This is due to the limitations of *Joi* native extensibility. Therefore, if in `Joi.string().add((it) => it.min(2).regex(/^[a-zA-Z0-9_]+$/))` both validations fail, only the first one will be in the error array (`error.details`). However, in `Joi.string().add((it) => it.min(2)).add((it) => it.regex(/^[a-zA-Z0-9_]+$/))`, they would both be normally logged.

### `.addFn(function, message, noKey)`

*`addFn()` is available for all native Joi types,* except `Joi.alternatives()`.

- `function`: *Function.* A function, taking the value to validate, and returning a boolean. When returning `true`, the validation will pass, when `false`, it will fail.
- `message` (optional): *String.* Personalized error message.
- `noKey` (optional): *Boolean.* Outputs the key or label in the error message when `false`, doesn't when `true`. Defaults to `true` if there is an explicit message. Defaults to `false` otherwise.

#### Example

A simple use case:

```javascript
// Will pass if the string is equal to 5; will fail otherwise
Joi.string().addFn((val) => val === '5').addLabel('MyString');
```

The error message here would be `'"MyString" didn't pass'`.

We can customize the message: `Joi.string().addFn((val) => false, 'My Message')` will have an error message of `'My Message'`.

If we didn't intend to override the key/label with our custom error message, we can explicitly set `noLabel` to `false`: `Joi.string().addFn((val) => false, 'My Message', false).label('My Label')` will have an error message of `'"My Label" My Message'`.

### `.addLabel(label)`

*`addLabel()` is available for all native Joi types,* except `Joi.alternatives()`.

- `label`: *String.* The label to use.

Many times we'll want to specifically identify when an error message comes from a labeled key. This is difficult to do in a generalizable and certain way, as the `error.details[0].context.label` will always contain a value, equal to the `options.language.root`, the object key, or the explicit label we gave it via [`any.label()`](https://github.com/hapijs/joi/blob/master/API.md#anylabelname).

We can use `addLabel()` instead of [`any.label()`](https://github.com/hapijs/joi/blob/master/API.md#anylabelname) to be able to identify with certainty whether the label was explicitly set, as `error.details[0].context.addLabel` will always be equal to the label value when used, or non existent when `addLabel()` was not used.

However, `addLabel()` internally uses the [`any.error()`](https://github.com/hapijs/joi/blob/master/API.md#anyerrorerr) *Joi* method. This has a limitation: if `any.error()` is used on any validation `addLabel()` has been used on, only one will have effects. To mitigate that, you can use [`onError()`.](#onerrorcallback)

```javascript
Joi.string().max(5).addLabel('My Label');
```

### `.onError(callback)`

*`onError()` is available for all native Joi types,* except `Joi.alternatives()`.

- `callback`: *Function,* same as for [`any.error()`](https://github.com/hapijs/joi/blob/master/API.md#anyerrorerr).

This method allows to safely use [`addLabel()`](#addlabellabel) while also customizing error handling, since when the native [`any.error()`](https://github.com/hapijs/joi/blob/master/API.md#anyerrorerr) is used on any validation `addLabel()` has been used on, it will override its effects.

```javascript
Joi.string().max(10).onError((errors) => {
    errs.forEach(err => {
        err.context.iChangedSomething = true;
    });
    return errs;
});
```
