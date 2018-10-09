/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const jsonPathChecker = require('../lib/j2119/json_path_checker')

describe('J2119 JsonPathChecker', () => {
  describe('should do simple paths', () => {
    const paths = [
      '$.foo.bar',
      '$..x',
      '$.foo.bar.baz.biff..blecch',
      '$.café_au_lait',
      "$['foo']",
      '$[3]'
    ]
    for (const path of paths) {
      it(path, () =>
        expect(jsonPathChecker.isPath(path)).to.be.true()
      )
    }
  })

  describe('should reject obvious botches', () => {
    const paths = [
      'x',
      '.x',
      'x.y.z',
      '$.~.bar'
    ]
    for (const path of paths) {
      it(path, () =>
        expect(jsonPathChecker.isPath(path)).to.be.false()
      )
    }
    for (const path of paths) {
      it(path, () =>
        expect(jsonPathChecker.isReferencePath(path)).to.be.false()
      )
    }
  })

  describe('should accept paths with bracket notation', () => {
    const paths = [
      "$['foo']['bar']",
      "$['foo']['bar']['baz']['biff']..blecch",
      "$['café_au_lait']"
    ]
    for (const path of paths) {
      it(path, () =>
        expect(jsonPathChecker.isPath(path)).to.be.true()
      )
    }
  })

  describe('should accept some Jayway JsonPath examples', () => {
    const paths = [
      '$.store.book[*].author',
      '$..author',
      '$.store.*',
      '$..book[2]',
      '$..book[0,1]',
      '$..book[:2]',
      '$..book[1:2]',
      '$..book[-2:]',
      '$..book[2:]',
      '$..*'
    ]
    for (const path of paths) {
      it(path, () =>
        expect(jsonPathChecker.isPath(path)).to.be.true()
      )
    }
  })

  describe('should allow reference paths', () => {
    const paths = [
      '$.foo.bar',
      '$..x',
      '$.foo.bar.baz.biff..blecch',
      '$.café_au_lait',
      "$['foo']['bar']",
      "$['foo']['bar']['baz']['biff']..blecch",
      "$['café_au_lait']",
      '$..author',
      '$..book[2]'
    ]
    for (const path of paths) {
      it(path, () =>
        expect(jsonPathChecker.isReferencePath(path)).to.be.true()
      )
    }
  })

  describe('should distinguish between non-paths, paths, and reference paths', () => {
    const paths = [
      '$.store.book[*].author',
      '$..author',
      '$.store.*',
      '$..book[2]',
      '$..book[0,1]',
      '$..book[:2]',
      '$..book[1:2]',
      '$..book[-2:]',
      '$..book[2:]',
      '$..*'
    ]
    const referencePaths = [
      '$..author',
      '$..book[2]'
    ]
    for (const path of paths) {
      it(path, () => {
        expect(jsonPathChecker.isPath(path)).to.be.true()
        if (referencePaths.includes(path)) {
          expect(jsonPathChecker.isReferencePath(path)).to.be.true()
        } else {
          expect(jsonPathChecker.isReferencePath(path)).to.be.false()
        }
      })
    }
  })
})
