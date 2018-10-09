const fs = require('fs')

const parser = require('./j2119/parser')
const nodeValidator = require('./j2119/node_validator')
const readlines = require('./j2119/readlines')

class Validator {
  constructor (assertionsFileName, extensionFileNames) {
    const f = fs.openSync(assertionsFileName, 'r')
    this.parser = parser(f)

    for (const fileName of extensionFileNames) {
      try {
        this.parser.extend(fs.openSync(fileName, 'r'))
      } catch (err) {
        throw new Error(`${fileName}: ${err.message}`)
      }
    }
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
    return `J2119 validator for instances of "${this.root}"\n${this.parser}`
  }
} // class Validator

function validate (jsonSource, parser) {
  const json = sourceToJSON(jsonSource)

  const validator = nodeValidator(parser)
  const problems = validator.validateDocument(json)

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

module.exports = (assertionsFileName, ...extensionFileNames) => new Validator(assertionsFileName, extensionFileNames)
