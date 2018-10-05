/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const conditional = require('../lib/j2119/conditional')
const constraint = require('../lib/j2119/constraints')

describe('J2119 Constraint', () => {
  describe('constraint', () => {
    it('should load and evaluate a condition', () => {
      const cut = constraint.hasField('foo')
      const json = { 'bar': 1 }
      expect(cut.applies(json, 'foo')).to.be.true()

      const cond = conditional.roleNotPresent(['foo', 'bar'])
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

  describe('constraint.doesNotHaveField', () => {
    it('should successfully detect a forbidden field', () => {
      const cut = constraint.doesNotHaveField('foo')
      const json = { 'foo': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should accept node with required field present', () => {
      const cut = constraint.doesNotHaveField('bar')
      const json = { 'foo': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })
  })

  describe('constraint.fieldValue', () => {
    it('should be a silent no-op exit if the field isn\'t there', () => {
      const cut = constraint.fieldValue('foo', {})
      const json = { 'foo': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    it('should detect a violation of enum policy', () => {
      const cut = constraint.fieldValue('foo', { enum: [ 1, 2, 3 ] })
      let json = { 'foo': 3 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)

      json = { 'foo': 5 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should detect a broken equals', () => {
      const cut = constraint.fieldValue('foo', { equal: 12 })
      let json = { 'foo': 12 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
      json = { 'foo': 3 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should do min right', () => {
      const cut = constraint.fieldValue('foo', { min: 1 })
      const problems = []
      let json = { 'foo': 1 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)

      json = { 'foo': 0 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should detect a broken floor', () => {
      const cut = constraint.fieldValue('foo', { floor: 1 })
      const json = { 'foo': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should detect a broken ceiling', () => {
      const cut = constraint.fieldValue('foo', { ceiling: 3 })
      const problems = []
      let json = { 'foo': 2 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)

      json = { 'foo': 3 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should do max right', () => {
      const cut = constraint.fieldValue('foo', { max: 3 })
      let json = { 'foo': 3 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)

      json = { 'foo': 4 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    it('should accept something within min/max range', () => {
      const cut = constraint.fieldValue('foo', { min: 0, max: 3 })
      const json = { 'foo': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })
  })

  describe('constraint.onlyOneOf', () => {
    it('Should detect more than one errors', () => {
      const cut = constraint.onlyOneOf(['foo', 'bar', 'baz'])
      const problems = []
      let json = { 'foo': 1 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)

      json = { 'foo': 1, 'bar': 2 }
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })
  })

  describe('constraint.fieldType', () => {
    it('should be a silent no-op exit if the field isn\'t there', () => {
      const cut = constraint.fieldType('foo', 'integer', false, false)
      const json = { 'bar': 1 }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    describe('should successfully approve correct types', () => {
      const tdata = {
        string: 'foo',
        integer: 3,
        float: 0.33,
        boolean: false,
        timestamp: '2016-03-14T01:59:00Z',
        object: { a: 1 },
        array: [ 3, 4 ],
        JSONPath: '$.a.c[2,3]',
        referencePath: '$.a[\'b\'].d[3]',
        URI: 'http://www.wmfs.net/'
      }
      for (const [type, value] of Object.entries(tdata)) {
        it(type, () => {
          const cut = constraint.fieldType('foo', type, false, false)
          const json = { foo: value }
          const problems = []
          cut.check(json, 'a.b.c', problems)
          expect(problems.length).to.equal(0)
        })
      }
    })

    it('should successfully find incorrect types in an array field', () => {
      const cut = constraint.fieldType('a', 'integer', false, false)
      const json = { 'a': [ 1, 2, 'foo', 4 ] }
      const problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)
    })

    describe('should successfully flag incorrect types', () => {
      const tdata = {
        string: 33,
        integer: 'foo',
        float: 17,
        boolean: 'null',
        timestamp: '2x16-03-14T015900Z',
        JSONPath: 'blibble',
        referencePath: '$.a.*',
        URI: 'trousers'
      }
      for (const [type, value] of Object.entries(tdata)) {
        it(type, () => {
          const cut = constraint.fieldType('foo', type, false, false)
          const json = { foo: value }
          const problems = []
          cut.check(json, 'a.b.c', problems)
          expect(problems.length).to.equal(1)
        })
      }
    })

    it('should handle nullable correctly', () => {
      const json = { 'a': null }
      let cut = constraint.fieldType('a', 'string', false, false)
      let problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(1)

      cut = constraint.fieldType('a', 'string', false, true)
      problems = []
      cut.check(json, 'a.b.c', problems)
      expect(problems.length).to.equal(0)
    })

    describe('should handle array nesting constraints', () => {
      it('field value is not an array', () => {
        const cut = constraint.fieldType('foo', 'array', false, false)
        const json = { foo: 1 }
        const problems = []
        cut.check(json, 'a.b.c', problems)
        expect(problems.length).to.equal(1)
      })

      it('field value is array, but types are wrong', () => {
        const cut = constraint.fieldType('foo', 'integer', true, false)
        const json = { foo: [ 'bar' ] }
        const problems = []
        cut.check(json, 'a.b.c', problems)
        expect(problems.length).to.equal(1)
      })

      it('field value is array and type is correct', () => {
        const cut = constraint.fieldType('foo', 'integer', true, false)
        const json = { foo: [ 1 ] }
        const problems = []
        cut.check(json, 'a.b.c', problems)
        expect(problems.length).to.equal(0)
      })
    })
  })
})
