/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const oxford = require('../lib/j2119/oxford')
const matcher = require('../lib/j2119/matcher')
const XRegExp = require('xregexp')


describe('matcher', () => {

  const EACHOF_LINES = [
    "Each of a Pass State, a Task State, a Choice State, and a Parallel State MAY have a boolean field named \"End\".",
    "Each of a Succeed State and a Fail State is a \"Terminal State\".",
    "Each of a Task State and a Parallel State MAY have an object-array field named \"Catch\"; each member is a \"Catcher\"."
  ]
  const ROLES = ['Pass State', 'Task State', 'Choice State', 'Parallel State',
    'Succeed State', 'Fail State', 'Task Tate']

  describe('should spot Each-of lines', () => {
    const cut = matcher('message')
    ROLES.forEach(role => cut.addRole(role))
    EACHOF_LINES.forEach(line =>
      it(line, () => {
        expect(cut.eachofMatch.test(line)).to.be.true()
      })
    )
  })

  it('should handle only-one-of lines', () => {
    const line = 'A x MUST have only one of "Seconds", "SecondsPath", "Timestamp", and "TimestampPath".'
    const cut = matcher('x')
    expect(cut.isOnlyOneMatchLine(line)).to.be.true()

    const m = cut.onlyOneMatch.test(line)
    expect(m).to.be.true()
    expect(m['role']).to.eql('x')
    const s = m['field_list']
    const l = oxford.breakStringList(s)
    expect(l).to.contain(['Seconds', 'SecondsPath', 'Timestamp', 'TimestampPath'])
    expect(l.length).to.eql(4)
  })

  const SPLIT_EACHOF_LINES = [
    [
      "A Pass State MAY have a boolean field named \"End\".",
      "A Task State MAY have a boolean field named \"End\".",
      "A Choice State MAY have a boolean field named \"End\".",
      "A Parallel State MAY have a boolean field named \"End\"."
    ],
    [
      "A Succeed State is a \"Terminal State\".",
      "A Fail State is a \"Terminal State\"."
    ],
    [
      "A Task State MAY have an object-array field named \"Catch\"; each member is a \"Catcher\".",
      "A Parallel State MAY have an object-array field named \"Catch\"; each member is a \"Catcher\"."
    ]
  ]
  xit('should properly disassemble each-of lines', () => {
    const cut = matcher('message')
    ROLES.forEach(role => cut.addRole(role))
    EACHOF_LINES.forEach(line => {
      wanted = SPLIT_EACHOF_LINES.shift()
      oxford.breakRoleList(cut, line).forEach(oneLine => {
        it(oneLine, () => {
          expect(wanted.includes(one_line)).to.be.true()
        })
      })
    })
  })

  const RDLINES = [
    "A State whose \"End\" field's value is true is a \"Terminal State\".",
    "Each of a Succeed State and a Fail state is a \"Terminal State\".",
    "A Choice Rule with a \"Variable\" field is a \"Comparison\"."
  ]
  describe('should spot role-def lines', () => {
    const cut = matcher('message')
    RDLINES.forEach(line =>
      it(line, () => {
        expect(cut.isRoleDefLine(line)).to.be.true()
      })
    )
  })

  const VALUE_BASED_ROLE_DEFS = [
    "A State whose \"End\" field's value is true is a \"Terminal State\".",
    "A State whose \"Comment\" field's value is \"Hi\" is a \"Frobble\".",
    "A State with a \"Foo\" field is a \"Bar\"."
  ]
  describe('should match value-based role defs', () => {
    const cut = matcher('State')

    VALUE_BASED_ROLE_DEFS.forEach(line => {
      it(line, () =>
        expect(cut.roledefMatch.test(line)).to.be.true()
      )
    })

    it(VALUE_BASED_ROLE_DEFS[0], () => {
      const m = cut.roledefMatch.test(VALUE_BASED_ROLE_DEFS[0])
      expect(m['role']).to.eql('State')
      expect(m['fieldtomatch']).to.eql('End')
      expect(m['valtomatch']).to.eql('true')
      expect(m['newrole']).to.eql('Terminal State')
      expect(m['val_match_present']).to.be.true()
    })

    it(VALUE_BASED_ROLE_DEFS[1], () => {
      const m = cut.roledefMatch.test(VALUE_BASED_ROLE_DEFS[1])
      expect(m['role']).to.eql('State')
      expect(m['fieldtomatch']).to.eql('Comment')
      expect(m['valtomatch']).to.eql('"Hi"')
      expect(m['newrole']).to.eql('Frobble')
      expect(m['val_match_present']).to.be.true()
    })

    it(VALUE_BASED_ROLE_DEFS[2], () => {
      const m = cut.roledefMatch.test(VALUE_BASED_ROLE_DEFS[2])
      expect(m['role']).to.eql('State')
      expect(m['newrole']).to.eql('Bar')
      expect(m['with_a_field']).to.be.true()
    })
  })

  it('should match is_a role defs', () => {
    const cut = matcher('Foo')
    expect(cut.roledefMatch.test('A Foo is a "Bar".')).to.be.true()
  })

  it('should properly parse is_a role defs', () => {
    const cut = matcher('Foo')
    cut.addRole('Bar')
    const c = cut.buildRoleDef('A Foo is a "Bar".')
    expect(c['val_match_present']).to.eql(null)
  })

  describe('should properly parse value-based role defs', () => {
    const cut = matcher('State')
    it(VALUE_BASED_ROLE_DEFS[0], () => {
      const c = cut.buildRoleDef(VALUE_BASED_ROLE_DEFS[0])
      expect(c['role']).to.eql('State')
      expect(c['fieldtomatch']).to.eql('End')
      expect(c['valtomatch']).to.eql('true')
      expect(c['newrole']).to.eql('Terminal State')
    })

    it(VALUE_BASED_ROLE_DEFS[1], () => {
      const c = cut.buildRoleDef(VALUE_BASED_ROLE_DEFS[1])
      expect(c['role']).to.eql('State')
      expect(c['fieldtomatch']).to.eql('Comment')
      expect(c['valtomatch']).to.eql('"Hi"')
      expect(c['newrole']).to.eql('Frobble')
    })
  })

  const LINES = [
    'A message MUST have an object field named "States"; each field is a "State".',
    'A message MUST have a negative-integer-array field named "StartAt".',
    'A message MAY have a string-array field named "StartAt".',
    'A message MUST NOT have a field named "StartAt".',
    'A message MUST have a field named one of "StringEquals", "StringLessThan", "StringGreaterThan", "StringLessThanEquals", "StringGreaterThanEquals", "NumericEquals", "NumericLessThan", "NumericGreaterThan", "NumericLessThanEquals", "NumericGreaterThanEquals", "BooleanEquals", "TimestampEquals", "TimestampLessThan", "TimestampGreaterThan", "TimestampLessThanEquals", or "TimestampGreaterThanEquals".'
  ]
  describe('should spot a simple constraint line', () => {
    const cut = matcher('message')
    LINES.forEach(line =>
      it(line, () => {
        expect(cut.isConstraintLine(line)).to.be.true()
      })
    )
  })

  describe('should spot a simple constraint line with new roles', () => {
    const cut = matcher('message')
    cut.addRole('avatar')
    const lines2 = LINES.map(line => line.replace('message', 'avatar'))
    lines2.forEach(line =>
      it(line, () =>
        expect(cut.isConstraintLine(line)).to.be.true()
      )
    )
  })

  const COND_LINES = [
    'An R1 MUST have an object field named "States"; each field is a "State".',
    'An R1 which is not an R2 MUST have an object field named "States"; each field is a "State".',
    'An R1 which is not an R2 or an R3 MUST NOT have a field named "StartAt".',
    'An R1 which is not an R2, an R3, or an R4 MUST NOT have a field named "StartAt".'
  ]
  describe('should catch a conditional on a constraint', () => {
    const excludes = [
      null,
      'an R2',
      'an R2 or an R3',
      'an R2, an R3, or an R4'
    ]
    const cut = matcher('R1')
    cut.addRole('R2')
    cut.addRole('R3')
    cut.addRole('R4')
    COND_LINES.forEach(line =>
      it(line, () => {
        expect(cut.constraintMatch.test(line)).to.be.true()
        const m = cut.constraintMatch.test(line)
        expect(m['excluded']).to.eql(excludes.shift)
      })
    )
  })

  describe('should match a reasonably complex constraint', () => {
    const s = 'A State MUST have a string field named "Type" whose value MUST be one of "Pass", "Succeed", "Fail", "Task", "Choice", "Wait", or "Parallel".'
    it(s, () => {
      const cut = matcher('State')
      expect(cut.constraintMatch.test(s)).to.be.true()
    })

    const r = 'A Retrier MAY have a nonnegative-integer field named "MaxAttempts" whose value MUST be less than 99999999.'
    it(r, () => {
      const cut = matcher('State')
      cut.addRole('Retrier')
      expect(cut.constraintMatch.test(r)).to.be.true()
    })
  })

  it('should build an enum constraint object', () => {
    const cut = matcher('State')
    const s = 'A State MUST have a string field named "Type" whose value MUST be one of "Pass", "Succeed", "Fail", "Task", "Choice", "Wait", or "Parallel".'
    const c = cut.buildConstraint(s)
    expect(c['role']).to.eql('State')
    expect(c['modal']).to.eql('MUST')
    expect(c['type']).to.eql('string')
    expect(c['field_name']).to.eql('Type')
    expect(c['relation']).to.be.null()
    expect(c['strings']).to.eql('"Pass", "Succeed", "Fail", "Task", "Choice", "Wait", or "Parallel"')
    expect(c['child_type']).to.be.null()
  })

  it('should tokenize string lists properly', () => {
    expect(matcher.tokenize_strings('"a"')).to.eql(['a'])
    expect(matcher.tokenize_strings('"a" or "b"')).to.eql(['a', 'b'])
    expect(matcher.tokenize_strings('"a", "b", or "c"')).to.eql(['a', 'b', 'c'])
  })

  it('should build a relational constraint object', () => {
    const cut = matcher('Retrier')
    const s = 'A Retrier MAY have a nonnegative-integer field named "MaxAttempts" whose value MUST be less than 99999999.'
    const c = cut.buildConstraint(s)
    expect(c['role']).to.eql('Retrier')
    expect(c['modal']).to.eql('MAY')
    expect(c['type']).to.eql('nonnegative-integer')
    expect(c['field_name']).to.eql('MaxAttempts')
    expect(c['strings']).to.be.null()
    expect(c['relation']).to.eql('less than')
    expect(c['target']).to.eql('99999999')
    expect(c['child_type']).to.be.null()
  })

  describe('should build a constraint object with child type', () => {
    const s = 'A State Machine MUST have an object field named "States"; each field is a "State".'
    it(s, () => {
      const cut = matcher('State Machine')
      expect(cut.constraintMatch.test(s)).to.be.true()
      const c = cut.buildConstraint(s)
      expect(c['role']).to.eql('State Machine')
      expect(c['modal']).to.eql('MUST')
      expect(c['type']).to.eql('object')
      expect(c['field_name']).to.eql('States')
      expect(c['child_type']).to.eql('field')
      expect(c['child_role']).to.eql('State')
    })

    const line = 'A State Machine MAY have an object field named "Not"; its value is a "FOO".'
    it(line, () => {
      const cut = matcher('State Machine')
      expect(cut.constraintMatch.test(line)).to.be.true()
      const c = cut.buildConstraint(line)
      expect(c['role']).to.eql('State Machine')
      expect(c['modal']).to.eql('MAY')
      expect(c['type']).to.eql('object')
      expect(c['field_name']).to.eql('Not')
      expect(c['child_role']).to.eql('FOO')
    })
  })
})
