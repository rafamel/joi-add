# joi-add

[![Version](https://img.shields.io/github/package-json/v/rafamel/joi-add.svg)](https://github.com/rafamel/joi-add)
[![Build Status](https://travis-ci.org/rafamel/joi-add.svg)](https://travis-ci.org/rafamel/joi-add)
[![Coverage](https://img.shields.io/coveralls/rafamel/joi-add.svg)](https://coveralls.io/github/rafamel/joi-add)
[![Dependencies](https://david-dm.org/rafamel/joi-add/status.svg)](https://david-dm.org/rafamel/joi-add)
[![Vulnerabilities](https://snyk.io/test/npm/joi-add/badge.svg)](https://snyk.io/test/npm/joi-add)
[![Issues](https://img.shields.io/github/issues/rafamel/joi-add.svg)](https://github.com/rafamel/joi-add/issues)
[![License](https://img.shields.io/github/license/rafamel/joi-add.svg)](https://github.com/rafamel/joi-add/blob/master/LICENSE)

**Add and expand on previously defined [*Joi*](https://github.com/hapijs/joi/) schemas. Define check-specific error messages.**

## Install

[`npm install joi-add`](https://www.npmjs.com/package/joi-add)

## Why

*joi-add* adds the possibility of customizing the error message for specific checks, as the *Joi* API method [`any.error()`](https://github.com/hapijs/joi/blob/master/API.md#anyerrorerr) will affect all of the checks of the validation. This is particularly useful when validating requests on the server and we'd like to offer meaningful error messages for distinct checks. The usage of *joi-add* with [*any.concat()*](https://github.com/hapijs/joi/blob/master/API.md#anyconcatschema) will allow for reusable, extensible schemas that produce meaningful error messages.

## Setup

Simply pass *Joi* to *joi-add*, like so:

```javascript
const baseJoi = require('joi');
const Joi = require('joi-add')(baseJoi);
```

Or simply:

```javascript
const Joi = require('joi-add')(require('joi'));
```

## Usage

### `.add(validation, message)`

- `validation`: *Joi* validation or *Joi* validation returning function.
- `message` (optional): Personalized error message.

**An example of a simple use case with `validation` as a *Joi* validation would be:**

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

Of course, if the validation is within an *object* schema, the error message will be full, as it's usual with *Joi*. As an example:

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

## Limitations

### Only the first inner error will be in the error array (`error.details`)

If more than one validations fail within the same `.add()`, only the first one be present in the `error.details` array. This is due to the limitations of *Joi* native extensibility. If in `Joi.string().add((it) => it.min(2).regex(/^[a-zA-Z0-9_]+$/))` both validations fail, only the first one will be on the error array (`error.details`). However, in `Joi.string().add((it) => it.min(2)).add((it) => it.regex(/^[a-zA-Z0-9_]+$/))`, they would be normally logged.

### Inner object schemas will lose their intermediary keys in the main error message

Take this schema:

```javascript
Joi.object().keys({
    a: Joi.object().keys({
        b: Joi.object().keys({
            c: Joi.string()
        })
    })
});
```

The `error.message` with the [default `language` options](https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback) would be `'child "a" fails because [child "b" fails because [child "c" fails because ["c" must be a string]]]'`. However, if part of the schema is inside `.add()`, it will lose the intermediary keys, but not the last (the one the error was produced at), from the main error message (`error.message`). For the following example, the message would be `'child "a" fails because ["c" must be a string]'`:

```javascript
Joi.object().keys({
    a: Joi.object().add((it) => it.keys({
        b: Joi.object().keys({
            c: Joi.string()
        })
    }))
});
```

Of course, you can always examine the error details to get the path (`error.details[0].path`), which in this case would correctly be `['a', 'b', 'c']`.
