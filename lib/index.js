const fs = require('fs')

const parser = require('./j2119/parser')
const nodeValidator = require('./j2119/node_validator')
const readlines = require('./j2119/readlines')

class Validator {
  constructor (assertionsFileName) {
    const f = fs.openSync(assertionsFileName, 'r')
    this.parser = parser(f)
  } // constructor

  validate (jsonSource) {
    try {
      return validate(jsonSource, this.parser)
    } catch (err) {
      return [ null, [ err.message ] ]
    }
  } // validator

  get root () { return this.parser.root }

  toString () {
    return `J2119 validator for instances of "${this.root}"`
  }
} // class Validator

function validate (jsonSource, parser) {
  const json = sourceToJSON(jsonSource)

  const problems = []
  const validator = nodeValidator(parser)
  validator.validateNode(json, parser.root, [parser.root], problems)

  return [json, problems]
} // validate

function sourceToJSON (jsonSource) {
  if (typeof jsonSource === 'object') {
    return jsonSource
  }

  // maybe it's a file name or descriptor?
  const json = tryReadAndParse(jsonSource)
  if (json) {
    return json
  }

  // ok, so let's see if it's a JSON string
  return JSON.parse(jsonSource)
} // sourceToJSON

function tryReadAndParse (jsonSource) {
  try {
    const lines = [...readlines(jsonSource)].join('\n')
    return JSON.parse(lines)
  } catch (err) {
    return null
  }
} // tryReadAndParse

module.exports = assertionsFileName => new Validator(assertionsFileName)
