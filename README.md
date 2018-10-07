# j2119
[![Tymly Package](https://img.shields.io/badge/tymly-package-blue.svg)](https://tymly.io/) [![npm (scoped)](https://img.shields.io/npm/v/@wmfs/j2119.svg)](https://www.npmjs.com/package/@wmfs/j2119) [![Build Status](https://travis-ci.org/wmfs/j2119.svg?branch=master)](https://travis-ci.org/wmfs/j2119) [![codecov](https://codecov.io/gh/wmfs/j2119/branch/master/graph/badge.svg)](https://codecov.io/gh/wmfs/j2119) [![CodeFactor](https://www.codefactor.io/repository/github/wmfs/j2119/badge)](https://www.codefactor.io/repository/github/wmfs/j2119) [![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/j2112/LICENSE)

A general-purpose validator generator that uses RFC2119-style assertions as input.

This package is derived from [awslabs/j2119](https://github.com/awslabs/j2119).

## Usage

There is only one outward-facing function, J2119Validator.

```javascript
validator = J2119Validator(schema-file)
```

Where ```schema-file``` is the name of a file containing text in the J2119 
syntax described below. This returns a validator, which can be re-used,
and should be, since its construction is moderately expensive:

```javascript
problems = validator.validate(json_source)
```

```json_source``` is the text to be validated; it can be a string or an IO or
a filename, J2119 tries to do the right thing. ```validate``` returns a string
array containing messages describing any problems it found. If the array is
empty, then there were no problems.

There are also two utility methods. ```parsed``` returns the parsed form of
the ```json_source``` text.  The idea is that if you want to do any further
semantic validation, there's no reason to parse the JSON twice.

```root``` returns the root "role" in the J2119 schema, a string that is
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
one specific JSON DSL, and at the time of writing of this document, there is
no claim that it is suitable as a general-purpose JSON schema facility.  At
this point, the best way to understand J2119 is by example.  In the
```data/``` directory of this gem there is a file ```AWL.j2119```, which
may be considered a complete worked example of how to specify a DSL.

## To Do 

At time of writing, the awslabs' package carries the following TODO

> At the moment, the J2119 syntax is parsed via the brute-force application of
overly complex regular expressions.  It is in serious need of modularization,
a real modern parser architecture, and perhaps the application of some
natural-language processing techniques.
>
> Aside from that, the framework of roles,
conditionals, and constraints is simple enough and performs at acceptable
speed.

## Contributing

Bug reports and pull requests are welcome on GitHub 

## <a name="license"></a>License
[MIT](https://github.com/wmfs/j2112/blob/master/LICENSE)

