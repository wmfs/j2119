/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const roleNotPresentCondition = require('../lib/j2119/conditional')

describe('J2119 RoleNotPresent Condition', () => {
  it('should fail on an excluded role', () => {
    const cut = roleNotPresentCondition(['foo', 'bar'])
    const json = { 'bar': 1 }

    expect(cut.constraintApplies(json, ['foo'])).to.be.false()
  })

  it('should succeed on a non-excluded role', () => {
    const cut = roleNotPresentCondition(['foo', 'bar'])
    const json = { 'bar': 1 }
    expect(cut.constraintApplies(json, ['baz'])).to.be.true()
  })
})
