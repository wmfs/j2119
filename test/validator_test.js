/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const tmp = require('tmp')
const fs = require('fs')
const validator = require('../lib')

const GOOD = '{ ' +
  ' "StartAt": "x", ' +
  ' "States": {' +
  '  "x": {' +
  '    "Type": "Pass",' +
  '    "End": true ' +
  '  }' +
  ' } ' +
  '}'

const SCHEMA = require.resolve('./fixtures/AWL.j2119')

describe('J2119 Validator', () => {
  it('should accept parsed JSON', () => {
    const v = validator(SCHEMA)
    const j = JSON.parse(GOOD)
    const [, p] = v.validate(j)
    expect(p.length).to.eql(0)
  })

  it('should accept JSON text', () => {
    const v = validator(SCHEMA)
    const [, p] = v.validate(GOOD)
    expect(p.length).to.eql(0)
  })

  it('should read a JSON file', () => {
    const tmpFile = tmp.fileSync()
    fs.writeSync(tmpFile.fd, GOOD)
    fs.closeSync(tmpFile.fd)

    const v = validator(SCHEMA)
    const [, p] = v.validate(tmpFile.name)
    expect(p.length).to.eql(0)
  })

  it('should produce some sort of sane message with bad JSON', () => {
    const v = validator(SCHEMA)
    const [j, p] = v.validate(GOOD + 'x')
    expect(j).to.be.null()
    expect(p.length).to.eql(1)
  })
})
