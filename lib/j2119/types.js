const TYPES = {
  array: 'array',
  object: 'object',
  string: 'string',
  boolean: 'boolean',
  numeric: 'numeric',
  integer: 'integer',
  float: 'float',
  timestamp: 'timestamp',
  JSONPath: 'JSONPath',
  referencePath: 'referencePath',
  URI: 'URI'
} // TYPES

const AllTypes = [...Object.values(TYPES)]

TYPES.includes = function (value) {
  for (const e of AllTypes) {
    if (e === value) {
      return true
    } // if ...
  } // for ...
  return false
} // includes

TYPES[Symbol.iterator] = function () {
  return AllTypes[Symbol.iterator]()
} // iterator

module.exports = TYPES
