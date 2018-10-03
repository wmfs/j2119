/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const allowedFields = require('../lib/j2119/allowed_fields')

describe('J2219 Allowed Fields', () => {
  it('should return a positive answer if appropriate', () => {
    const cut = allowedFields()
    cut.setAllowed('foo', 'bar')
    expect(cut.isAllowed([ 'foo' ], 'bar')).to.be.true()
    expect(cut.isAllowed([ 'bar', 'baz', 'foo' ], 'bar')).to.be.true()
  })

  it('should return a negative answer if appropriate', () => {
    const cut = allowedFields()
    cut.setAllowed('foo', 'bar')
    expect(cut.isAllowed([ 'foo' ], 'baz')).to.be.false()
    expect(cut.isAllowed([ 'bar', 'baz', 'foo' ], 'baz')).to.be.false()
  })

  it('should survive wonky queries', () => {
    const cut = allowedFields()
    cut.setAllowed('foo', 'bar')
    expect(!cut.isAllowed([ 'boo' ], 'baz')).to.be.true()
    expect(!cut.isAllowed([ ], 'baz')).to.be.true()
  })
})
