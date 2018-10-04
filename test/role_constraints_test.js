/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const roleConstraints = require('../lib/j2119/role_constraints')
const constraint = require('../lib/j2119/constraints')

describe('roleConstraints', () => {
  describe('should successfully remember constraints', () => {
    const cut = roleConstraints()
    const c1 = constraint.hasField('foo')
    const c2 = constraint.doesNotHaveField('bar')
    cut.add('MyRole', c1)
    cut.add('MyRole', c2)
    cut.add('OtherRole', c1)

    it('two constraints', () => {
      const r = cut.getConstraints('MyRole')
      expect(r.length).to.eql(2)
      expect(r.includes(c1)).to.be.true()
      expect(r.includes(c2)).to.be.true()
    })

    it('one constraints', () => {
      const r = cut.getConstraints('OtherRole')
      expect(r.length).to.eql(1)
      expect(r.includes(c1)).to.be.true()
    })

    it('no constraints', () => {
      expect(cut.getConstraints('No Constraints').length).to.eql(0)
    })
  })
})
