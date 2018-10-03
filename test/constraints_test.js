/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const roleNotPresentCondition = require('../lib/j2119/conditional')
const constraint = require('../lib/j2119/constraints')

describe('J2119 Constraint', () => {
  describe('constraint', () => {
    it('should load and evaluate a condition', () => {
      const cut = constraint.hasField('foo')
      const json = { 'bar': 1 }
      expect(cut.applies(json, 'foo')).to.be.true()

      const cond = roleNotPresentCondition(['foo', 'bar'])
      cut.addCondition(cond)
      expect(cut.applies(json, ['foo'])).to.be.false()
      expect(cut.applies(json, ['baz'])).to.be.true()
    })
  })

  describe('constraint.hasField', () => {
    it('should successfully detect a missing field', () => {
      const cut = constraint.hasField('foo')
      const json = { 'bar': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should accept node with required field present', () => {
      const cut = constraint.hasField('bar')
      const json = { 'bar': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })
  })

  describe('constraint.nonEmpty', () => {
    it('should bypass an absent field', () => {
      const cut = constraint.nonEmpty('foo')
      const json = { 'bar': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    it('should bypass a non-array field', () => {
      const cut = constraint.nonEmpty('foo')
      const json = { 'foo': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    it('should OK a non-empty array', () => {
      const cut = constraint.nonEmpty('foo')
      const json = { 'foo': [ 1 ] }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    it('should catch an empty array', () => {
      const cut = constraint.nonEmpty('foo')
      const json = { 'foo': [ ] }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })
  })

  /*
  describe('J2119::DoesNotHaveFieldConstraint', () => {
    it('should successfully detect a forbidden field', () => {
      const cut = J2119::DoesNotHaveFieldConstraint('foo')
      const json = { 'foo': 1 }'
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should accept node with required field present', () => {
      const cut = J2119::DoesNotHaveFieldConstraint('bar')
      const json = { 'foo': 1 }'
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

  })

  describe('J2119::FieldValueConstraint', () => {

    it('should be a silent no-op exit if the field isn\'t there', () => {
      const cut = J2119::FieldValueConstraint('foo', {})
      const json = JSON.parse('{"foo': 1 }')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    it('should detect a violation of enum policy', () => {
      const cut = J2119::FieldValueConstraint('foo', :enum => [ 1, 2, 3] )
      const json = JSON.parse('{"foo': 5}')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should detect a broken equals', () => {
      const cut = J2119::FieldValueConstraint('foo', :equal => 12 )
      const json = JSON.parse('{"foo': 12}')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
      const json = JSON.parse('{"foo': 3}')
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should do min right', () => {
      const cut = J2119::FieldValueConstraint('foo', :min => 1 )
      const problems = []
      const json = JSON.parse('{"foo': 1 }')
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)

      const json = JSON.parse('{"foo': 0}')
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should detect a broken floor', () => {
      const cut = J2119::FieldValueConstraint('foo', :floor => 1 )
      const json = JSON.parse('{"foo': 1 }')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should detect a broken ceiling', () => {
      const cut = J2119::FieldValueConstraint('foo', :ceiling => 3 )
      const json = JSON.parse('{"foo': 3}')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should do max right', () => {
      const cut = J2119::FieldValueConstraint('foo', :max => 3 )
      const json = JSON.parse('{"foo': 3}')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
      const json = JSON.parse('{"foo': 4}')
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should accept something within min/max range', () => {
      const cut = J2119::FieldValueConstraint('foo', :min => 0, :max => 3 )
      const json = JSON.parse('{"foo': 1 }')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })
  })

  describe('J2119::OnlyOneOfConstraint', () => {
    it('Should detect more than one errors', () => {
      const cut = J2119::OnlyOneOfConstraint(['foo', 'bar', 'baz'])
      const json = { 'foo': 1, "bar': 2 }'
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })
  })

  describe('J2119::FieldTypeConstraint', () => {
    it('should be a silent no-op exit if the field isn\'t there', () => {
      const cut = J2119::FieldTypeConstraint('foo', :integer, false, false)
      const json = JSON.parse('{"bar': 1 }')
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    it('should successfully approve correct types', () => {
      tdata = { :string => '"foo', :integer => 3, :float => 0.33,
    :boolean => false, :timestamp => '"2016-03-14T01:59:00Z',
    :object => { 'a': 1 }', :array => '[ 3, 4 ]',
    :json_path => "\"$.a.c[2,3]\"", :reference_path => "\"$.a['b'].d[3]\""
    }
      tdata.each () => { |type, value|
      const cut = J2119::FieldTypeConstraint('foo', type, false, false)
        j = "{\"foo\': #{value}}"
        const json = JSON.parse(j)
        const problems = []
        cut.check(json, 'a.b.c', problems)
        expect(problems.length).to.equal(0)
      })


    it('should successfully find incorrect types in an array field', () => {
      const cut = J2119::FieldTypeConstraint('a', :integer, false, false)
      j = { 'a': [ 1, 2, "foo", 4 ] }'
      const json = JSON.parse(j)
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should successfully flag incorrect types', () => {
      tdata = { :string => 33, :integer => '"foo', :float => 17,
    :boolean => 'null', :timestamp => '"2x16-03-14T01:59:00Z',
    :json_path => '"blibble', :reference_path => '"$.a.*' }
      tdata.each', () => { |type, value|
      const cut = J2119::FieldTypeConstraint('foo', type, false, false)
      j = "{\"foo\': #{value}}"
      const json = JSON.parse(j)
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })
  })

  it('should handle nullable correctly', () => {
    tdata = { :a => nil }
    j = { 'a': null }'
    const json = j
    const cut = J2119::FieldTypeConstraint('a', :string, false, false)
    const problems = []
    cut.check(json, 'a.b.c', problems)
    expect(problems.length).to.equal(1)
    const cut = J2119::FieldTypeConstraint('a', :string, false, true)
    const problems = []
    cut.check(json, 'a.b.c', problems)
    expect(problems.length).to.equal(0)
  })

  it('should handle array nesting constraints', () => {
    const cut = J2119::FieldTypeConstraint('foo', :array, false, false)
    const json = '{"foo': 1 }'
    const problems = []
    cut.check(json, 'a.b.c', problems)
    expect(problems.length).to.equal(1)

    const cut = J2119::FieldTypeConstraint('foo', :integer, true, false)
    const json = '{"foo': [ "bar" ] }'
    const problems = []
    cut.check(json, 'a.b.c', problems)
    expect(problems.length).to.equal(1)
    const json = '{"foo': [ 1 ] }'
    const problems = []
    cut.check(json, 'a.b.c', problems)
    expect(problems.length).to.equal(0)
  })

  })
  */

})