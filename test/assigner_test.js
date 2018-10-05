/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const roleConstraints = require('../lib/j2119/role_constraints')
const allowedFields = require('../lib/j2119/allowed_fields')
const lineMatcher = require('../lib/j2119/line_matcher')
const roleFinder = require('../lib/j2119/role_finder')
const assigner = require('../lib/j2119/assigner')

describe('J2119 Assigner', () => {

  it('should attach a condition to a constraint', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MUST',
      'field_name': 'foo',
      'excluded': 'an A, a B, or a C'
    }
    const roles = [ 'A', 'B', 'C' ]
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    roles.forEach(role => matcher.addRole(role))
    const permittedFields = allowedFields()

    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)

    const retrieved = constraints.getConstraints('R')
    const c = retrieved[0]
    const json = { 'a': 1 }
    roles.forEach(role =>
      expect(c.applies(json, [ role ])).to.be.false()
    )
    expect(c.applies(json, [ 'foo' ])).to.be.true()
  })

  it('should handle a "non-zero ... less than" constraint properly', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MAY',
      'type': 'nonnegative-integer',
      'field_name': 'MaxAttempts',
      'relation': 'less than',
      'target': '99999999'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)

    const retrieved = constraints.getConstraints('R').map(r => r.toString())
    expect(retrieved.length).to.eql(3)
    expect(retrieved).to.include('<Field MaxAttempts should be of type integer>')
    expect(retrieved).to.include('<Field MaxAttempts has constraints {"min":0}>')
    expect(retrieved).to.include('<Field MaxAttempts has constraints {"ceiling":99999999}>')
  })

  it('should assign an only_one_of constraint properly', () => {
    const assertion = {
      'role': 'R',
      'field_list': '"foo", "bar", and "baz"'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignOnlyOneOf(assertion)

    const retrieved = constraints.getConstraints('R').map(r => r.toString())
    expect(retrieved.length).to.eql(1)
    expect(retrieved[0]).to.eql('<Node can have one of ["foo","bar","baz"] fields>')
  })

  it('should add a HasFieldConstraint if there\'s a MUST', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MUST',
      'field_name': 'foo'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)

    const retrieved = constraints.getConstraints('R').map(r => r.toString())
    expect(retrieved.length).to.eql(1)
    expect(retrieved[0]).to.eql('<Field foo should be present>')
  })

  it('should add a DoesNotHaveFieldConstraint if there\'s a MUST NOT', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MUST NOT',
      'field_name': 'foo'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)

    const retrieved = constraints.getConstraints('R').map(r => r.toString())
    expect(retrieved.length).to.eql(1)
    expect(retrieved[0]).to.eql('<Field foo should be absent>')
  })

  it('should manage a complex type constraint ', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MUST',
      'field_name': 'foo',
      'type': 'nonnegative-float'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)

    const retrieved = constraints.getConstraints('R').map(r => r.toString())
    expect(retrieved.length).to.eql(3)
    expect(retrieved).to.include('<Field foo should be of type float>')
    expect(retrieved).to.include('<Field foo has constraints {"min":0}>')
    expect(retrieved).to.include('<Field foo should be present>')
  })

  it('should record a relational constraint ', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MUST',
      'field_name': 'foo',
      'type': 'nonnegative-float',
      'relation': 'less than',
      'target': '1000'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)

    const retrieved = constraints.getConstraints('R').map(r => r.toString())
    expect(retrieved.length).to.eql(4)
    expect(retrieved).to.include('<Field foo should be of type float>')
    expect(retrieved).to.include('<Field foo has constraints {"min":0}>')
    expect(retrieved).to.include('<Field foo has constraints {"ceiling":1000}>')
    expect(retrieved).to.include('<Field foo should be present>')
  })

  it('should record an is_a role', () => {
    const assertion = {
      'role': 'R',
      'newrole': 'S'
    }
    const rf = roleFinder()
    const constraints = roleConstraints()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignRoles(assertion)
    const json = { 'a': 3 }
    const roles = [ 'R' ]
    rf.findMoreRoles(json, roles)
    expect(roles).to.eql([ 'R', 'S' ])
  })

  it('should correctly assign a field value role', () => {
    const assertion = {
      'role': 'R',
      'fieldtomatch': 'f1',
      'valtomatch': '33',
      'newrole': 'S',
      'val_match_present': true
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('R')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignRoles(assertion)
    const json = { 'f1': 33 }
    const roles = [ 'R' ]
    rf.findMoreRoles(json, roles)
    expect(roles).to.eql(['R', 'S'])
  })

  it('should process a child role in an assertion', () => {
    const assertion = {
      'role': 'R',
      'modal': 'MUST',
      'field_name': 'a',
      'child_type': 'field',
      'child_role': 'bar'
    }
    const constraints = roleConstraints()
    const rf = roleFinder()
    const matcher = lineMatcher('x')
    const permittedFields = allowedFields()
    const cut = assigner(constraints, rf, matcher, permittedFields)
    cut.assignConstraints(assertion)
    const roles = [ 'R' ]
    const fieldRoles = rf.findGrandchildRoles(roles, 'a')
    expect(fieldRoles).to.eql([ 'bar' ])
  })
})
