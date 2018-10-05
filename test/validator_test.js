/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

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

const SCHEMA = 'data/AWL.j2119'

describe('J2119 Validator', () => {
  it('should accept parsed JSON', () => {
    const v = validator(SCHEMA)
    const j = JSON.parse(GOOD)
    const p = v.validate(j)
    expect(p.length).to.eql(0)
  })

  it('should accept JSON text', () => {
    const v = validator(SCHEMA)
    const p = v.validate(GOOD)
    expect(p.length).to.eql(0)
  })

  xit('should read a JSON file', () => {
    /*
        v = J2119::Validator.new SCHEMA
        fn = "/tmp/#{$$}.tjf"
        f = File.open(fn, "w")
        f.write GOOD
        f.close

        p = v.validate fn
        File.delete fn
        expect(p.empty?).to be true
  */
  })

  it('should produce some sort of sane message with bad JSON', () => {
    const v = validator(SCHEMA)
    const p = v.validate(GOOD + 'x')
    expect(p.length).to.eql(1)
  })
})