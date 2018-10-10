# j2119
[![Tymly Package](https://img.shields.io/badge/tymly-package-blue.svg)](https://tymly.io/) [![npm (scoped)](https://img.shields.io/npm/v/@wmfs/j2119.svg)](https://www.npmjs.com/package/@wmfs/j2119) [![Build Status](https://travis-ci.com/wmfs/j2119.svg?branch=master)](https://travis-ci.org/wmfs/j2119) [![codecov](https://codecov.io/gh/wmfs/j2119/branch/master/graph/badge.svg)](https://codecov.io/gh/wmfs/j2119) [![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/j2112/LICENSE)

A general-purpose validator generator that uses RFC2119-style assertions as input.

This package is derived from Amazon Web Services Labs' [awslabs/j2119](https://github.com/awslabs/j2119).

## Usage

There is only one outward-facing function, `J2119Validator`.

```javascript
const J2119Validator = require('@wmfs/j2119')

const validator = J2119Validator(schema-filename, ...[schema-extension-filenames])
```

* `schema-filename` is the name of a file containing text in the J2119
syntax described below. 
* `schema-extension-filenames` are zero or more names of files containing extensions 
to the schema, using the same J2119 syntax.

`J2219Validator` returns a validator, which can be re-used, and should be, since its 
construction is moderately expensive.  If the schema files can not be read, then
the function will throw an exception.

### validate
```javascript
const problems = validator.validate(json)
```

* `source` is the JSON object to be validated.
 
 `validate` returns a string array of error messages describing any problems it found. If the array is empty, then there were no problems. The error messages are human-readable and have the general form `<json-path to error site> <description of error>`.

### root
```javascript
const root = validator.root
```

`root` returns the root "role" in the J2119 schema, a string that is
useful in making user-friendly error messages.

## J2119 Syntax

J2119's operations are driven by a set of assertions containing the words
"MUST" and "MAY" used in the style found in IETF RFCs, and specified in
RFC 2119.  It is organized in lines, each terminated with a single full stop.
There are three formalisms, "roles", "types" and "constraints". For example:

```
A Message MUST have an object-array field named "Paragraphs"; each member is a "Paragraph".
```

In the above assertion, "Message" and "Paragraph" are roles, "string-array" is a
type; the whole line says that a JSON node with the role "Message" is required
to have a field named "Paragraphs" whose value is a JSON array containing only
object values.   It further says that when validating the object members of
the array, they are considered to have the role "Paragraph".

The first line of the J2119 schema must be of the following form:

```
This document specifies a JSON object called a "Message".
```

This gives the root object the role "Message". Descendant nodes can be given
roles based on their parentage (as in the first J2119 example above) and the
presence or value of certain fields, and nodes can have multiple roles
simultaneously.

The J2119 syntax was invented for the purpose of constructing a validator for
one specific JSON DSL ([the Amazon States Language](https://states-language.net/spec.html)) and, at time of writing, there is
no claim that it is suitable as a general-purpose JSON schema facility.  At
this point, the best way to understand J2119 is by example.  In the
test fixtures directory of this package there is a file [`AWL.j2119`](https://github.com/wmfs/j2119/blob/master/test/fixtures/AWL.j2119), which
may be considered a complete worked example of how to specify a DSL.  

### Schema Extensions

As WMFS were adapting this code from the AWS Labs original, it became apparent we 
had a couple of small extensions to ASL which caused our validation to fail. Rather 
than drop additional rules into the ASL definition, we defined our assertions as extensions.  Extensions are organized exactly as above, except that the first line
of a J2119 schema extension have the form:

```
This document specifies an extension to a JSON object called a "Message".
``` 

The object name must match that in the root schema.  See the file [`TymlyExtension.j2119`](https://github.com/wmfs/j2119/blob/master/test/fixtures/TymlyExtension.j2119) for an example of a DSL extension.

## To Do

At time of writing, the AWS Labs' package carries the following TODO

> At the moment, the J2119 syntax is parsed via the brute-force application of
overly complex regular expressions.  It is in serious need of modularization,
a real modern parser architecture, and perhaps the application of some
natural-language processing techniques.
>
> Aside from that, the framework of roles,
conditionals, and constraints is simple enough and performs at acceptable
speed.

## Contributing

Bug reports and pull requests are welcome on GitHub. Please be aware of our [Code of Conduct](https://github.com/wmfs/j2112/blob/master/CODE_OF_CONDUCT.md)

## <a name="license"></a>License
Licensed under the terms of the [MIT license](https://github.com/wmfs/j2112/blob/master/LICENSE). Copyright (c) 2018 West Midlands Fire Service

