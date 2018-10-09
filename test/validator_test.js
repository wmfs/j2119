/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const tmp = require('tmp')
const fs = require('fs')
const validator = require('../lib')

const STATE_MACHINE = {
  StartAt: 'x',
  States: {
    x: {
      Type: 'Pass',
      End: true
    }
  }
}

const STATE_MACHINE_WITH_EXTENSION = {
  StartAt: 'x',
  States: {
    x: {
      Type: 'Pass',
      End: true
    }
  },
  namespace: 'Test',
  name: 'Extension'
}

const SCHEMA = require.resolve('./fixtures/AWL.j2119')
const EXTENSION = require.resolve('./fixtures/TymlyExtension.j2119')
const BAD = require.resolve('./fixtures/Bad.j2119')

describe('J2119 Validator', () => {
  it('should accept parsed JSON', () => {
    const v = validator(SCHEMA)
    const [, p] = v.validate(STATE_MACHINE)
    expect(p.length).to.eql(0)
  })

  it('should accept JSON text', () => {
    const v = validator(SCHEMA)
    const [, p] = v.validate(JSON.stringify(STATE_MACHINE))
    expect(p.length).to.eql(0)
  })

  it('should read a JSON file', () => {
    const tmpFile = tmp.fileSync()
    fs.writeSync(tmpFile.fd, JSON.stringify(STATE_MACHINE))
    fs.closeSync(tmpFile.fd)

    const v = validator(SCHEMA)
    const [, p] = v.validate(tmpFile.name)
    expect(p.length).to.eql(0)
  })

  it('should produce some sort of sane message with bad JSON', () => {
    const v = validator(SCHEMA)
    const [j, p] = v.validate(STATE_MACHINE + 'x')
    expect(j).to.be.null()
    expect(p.length).to.eql(1)
  })

  it('produce a nice string', () => {
    const s = validator(SCHEMA).toString()
    expect(s).to.not.contain('[object')
  })

  it('load an extension', () => {
    const v = validator(SCHEMA, EXTENSION)
    const [, p] = v.validate(STATE_MACHINE)
    expect(p.length).to.eql(2) // missing extensions!

    const [, np] = v.validate(STATE_MACHINE_WITH_EXTENSION)
    expect(np.length).to.eql(0)
  })

  it('report when unable to load', () => {
    expect(() => validator(SCHEMA, 'chuckle-brothers')).to.throw('no such file')
    expect(() => validator(SCHEMA, BAD)).to.throw('Could not extend parser')
    expect(() => validator(SCHEMA, EXTENSION, BAD)).to.throw('Could not extend parser')
    expect(() => validator(BAD)).to.throw('Could not create parser')
  })
})
