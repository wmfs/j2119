/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const deduce = require('../lib/j2119/deduce')

describe('J2119 Deduce', () => {
  const tests = [
    ['string', '"foo"', 'foo'],
    ['true literal', 'true', true],
    ['false literal', 'false', false],
    ['null', 'null', null],
    ['integer', '234', 234],
    ['float', '25.411', 25.411]
  ]

  for (const [label, value, expected] of tests) {
    it(`deduce ${label}`, () => {
      expect(deduce(value)).to.equal(expected)
    })
  }
})
