const fs = require('fs')

const parser = require('./j2119/parser')
const nodeValidator = require('./j2119/node_validator')

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

  validate (json) {
    if (Array.isArray(json) || (typeof json !== 'object')) {
      return [ 'Not a JSON object' ]
    }

    const validator = nodeValidator(this.parser)
    return validator.validateDocument(json)
  } // validator

  get root () { return this.parser.root }

  toString () {
    return `J2119 validator for instances of "${this.root}"\n${this.parser}`
  }
} // class Validator

module.exports = (assertionsFileName, ...extensionFileNames) => new Validator(assertionsFileName, extensionFileNames)
