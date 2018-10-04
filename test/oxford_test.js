/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const oxford = require('../lib/j2119/oxford')
const matcher = require('../lib/j2119/matcher')
const XRegExp = require('xregexp')

describe('oxford', () => {
  describe('should show the underlying pattern working', () => {
    const re = new XRegExp('^' + oxford.BASIC + '$')
    const targets = [
      'X',
      'X or X',
      'X, X, or X',
      'X, X, X, or X'
    ]
    for (const target of targets) {
      it(target, () => expect(re.test(target)).to.be.true())
    }
  })

  describe('should do a no-article no-capture no-connector match', () => {
    const targets = [
      'a',
      'a or aa',
      'a, aa, or aaa',
      'a, aa, aaa, or aaaa'
    ]
    const cut = new XRegExp('^' + oxford.re('a+') + '$')
    for (const target of targets) {
      it(target, () => expect(cut.test(target)).to.be.true())
    }
  })

  describe('should do one with capture, articles, and connector', () => {
    const targets = [
      'an "asdg"',
      'a "foij2pe" and an "aiepw"',
      'an "alkvm 2", an "ap89wf", and a " lfdj a fddalfkj"',
      'an "aj89peww", a "", an "aslk9 ", and an "x"'
    ]
    const re = oxford.re(
      '"([^"]*)"', {
        connector: 'and',
        use_article: true,
        capture_name: 'capture_me'
      })
    const cut = new XRegExp('^' + re + '$')
    for (const target of targets) {
      it(target, () => expect(cut.test(target)).to.be.true())
    }
  })

  const OXFORD_LISTS = [
    ['an R2', [ 'R2' ] ],
    ['an R2 or an R3', [ 'R2', 'R3' ] ],
    ['an R2, an R3, or an R4', [ 'R2', 'R3', 'R4' ] ]
  ]
  const roles = [ 'R2', 'R3', 'R4' ]
  xdescribe('should properly break up a role list', () => {
    const match = matcher('R1')
    roles.forEach(role => match.addRole(role))
    OXFORD_LISTS.forEach(([list, expected]) => {
      xit(list, () => {
        expect(oxford.breakRoleList(match, list)).to.equal(expected)
      })
    })
  })

  const STRING_LISTS = [
    ['"R2"', [ 'R2' ] ],
    ['"R2" or "R3"', [ 'R2', 'R3' ] ],
    ['"R2", "R3", or "R4"', [ 'R2', 'R3', 'R4' ] ]
  ]
  describe('should properly break up a string list', () => {
    STRING_LISTS.forEach(([list, expected]) => {
      it(list, () => {
        expect(oxford.breakStringList(list)).to.eql(expected)
      })
    })
  })
})
