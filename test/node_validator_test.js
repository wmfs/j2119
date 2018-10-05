/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const nodeValidator = require('../lib/j2119/node_validator')
const roleFinder = require('../lib/j2119/role_finder')
const roleConstraints = require('../lib/j2119/role_constraints')
const constraints = require('../lib/j2119/constraints')

describe('J2119 NodeValidator', () => {
  it('should report problems with faulty fields', () => {
    const rf = roleFinder()
    const rc = roleConstraints()
    const roles = ['Role1']

    // among fields
    // 'a' should exist
    // 'b' should not exist
    // 'c' should be a float
    // 'd' should be an integer
    // 'e' should be a number
    // 'f' should be between 0 and 5
    const json = {
      b: 1,
      c: 1,
      d: 0.3,
      e: true,
      f: 10
    }

    const fieldConstraints = [
      constraints.hasField('a'),
      constraints.doesNotHaveField('b'),
      constraints.fieldType('c', 'float', false, false),
      constraints.fieldType('d', 'integer', false, false),
      constraints.fieldType('e', 'numeric', false, false),
      constraints.fieldValue('f', { min: 0, max: 5 })
    ]
    fieldConstraints.forEach(constraint =>
      rc.add('Role1', constraint)
    )

    const problems = []
    const cut = nodeValidator(new FakeParser(rc, rf))
    cut.validateNode(json, 'x.y', roles, problems)

    expect(problems.length).to.eql(fieldConstraints.length)
  })
})

class FakeParser {
  constructor (rc, rf) {
    this.rc = rc
    this.rf = rf
  }

  getConstraints (r) {
    return this.rc.getConstraints(r)
  }

  findMoreRoles (n, r) {
    return this.rf.findMoreRoles(n, r)
  }

  findGrandchildRoles (r, f) {
    return this.rf.findGrandchildRoles(r, f)
  }

  findChildRoles (r, f) {
    return this.rf.findChildRoles(r, f)
  }

  isFieldAllowed (r, f) {
    return true
  }
}
