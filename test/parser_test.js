/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const fs = require('fs')

const parser = require('../lib/j2119/parser')
const nodeValidator = require('../lib/j2119/node_validator')

describe('J2119 Parser', () => {
  it('should match ROOT', () => {
    expect(parser.ROOT.test('This document specifies a JSON object called a "State Machine".')).to.be.true()
    expect(parser.EXTENSION_ROOT.test('This document specifies an extension to a JSON object called a "State Machine".')).to.be.true()
  })

  describe('read good definitions', () => {
    describe('AWL.j2119', () => {
      const p = parser(open('./fixtures/AWL.j2119'))
      const v = nodeValidator(p)
      explore(v)
    })
    describe('AWL.j2119 and Tymly-extension.j2119', () => {
      describe('before loading extensions', () => {
        const p = parser(open('./fixtures/AWL.j2119'))
        const v = nodeValidator(p)

        explore(v)
        tymlyExtensions('can\'t validate when no extensions loaded', v, 2)
      })

      describe('after loading extensions', () => {
        const p = parser(open('./fixtures/AWL.j2119'))
        const v = nodeValidator(p)
        p.extend(open('./fixtures/TymlyExtension.j2119'))

        tymlyExtensions('validate once extensions loaded', v, 0)
      })
    })
  })

  describe('fail on bad definitions', () => {
    it('fail to read bad definition', () => {
      const f = open('./fixtures/Bad.j2119')
      expect(() => parser(f)).to.throw('Unrecognized line')
    })

    it('fail to read malformed definition', () => {
      const f = open('./fixtures/Malformed.j2119')
      expect(() => parser(f)).to.throw('Unprocessable line')
    })
    it('fail to read extension definition as root definition', () => {
      const f = open('./fixtures/TymlyExtension.j2119')
      expect(() => parser(f)).to.throw('Root declaration must be first line')
    })

    it('good parser, not an extension', () => {
      const p = parser(open('./fixtures/AWL.j2119'))
      const ext = open('./fixtures/AWL.j2119')
      expect(() => p.extend(ext)).to.throw('Extension declaration must be first line')
    })

    it('good parser, extension for different object', () => {
      const p = parser(open('./fixtures/AWL.j2119'))
      const ext = open('./fixtures/Chum.j2119')
      expect(() => p.extend(ext)).to.throw('Extension does not extend "State Machine"')
    })

    it('good parser, garbage', () => {
      const p = parser(open('./fixtures/AWL.j2119'))
      const ext = open('./parser_test.js')
      expect(() => p.extend(ext)).to.throw('Extension declaration must be first line')
    })

    it('good parser, over eager extension', () => {
      const p = parser(open('./fixtures/AWL.j2119'))
      const ext = open('./fixtures/OvereagerExtension.j2119')
      expect(() => p.extend(ext)).to.throw('Only one extension declaration permitted per file')
    })
  })
})

function explore (v) {
  // just gonna run through the state machine spec exercising each
  //  constraint

  const obj = { StartAt: 'pass' }

  it('root', () => {
    runTest(v, obj, 1)

    delete obj.StartAt
    obj.States = {}
    runTest(v, obj, 1)

    obj.StartAt = 'pass'
    runTest(v, obj, 0)

    obj.Version = 3
    runTest(v, obj, 1)

    obj.Version = '1.0'
    obj.Comment = true
    runTest(v, obj, 1)

    obj.Comment = 'Hi'
    const states = obj.States
    states.pass = {}
    runTest(v, obj, 2)
  })

  it('Pass state', () => {
    // Pass state & general
    const pass = obj.States.pass
    pass.Next = 's1'
    pass.Type = 'Pass'

    runTest(v, obj, 0)

    pass.Type = 'flibber'
    runTest(v, obj, 1)

    pass.Type = 'Pass'
    pass.Comment = 23.5
    runTest(v, obj, 1)

    pass.Type = 'Pass'
    pass.Comment = ''
    runTest(v, obj, 0)

    pass.Type = 'Pass'
    pass.Comment = ''
    pass.End = 11
    runTest(v, obj, 1)

    pass.End = true
    runTest(v, obj, -1)

    delete pass.Next
    runTest(v, obj, 0)

    pass.InputPath = 1
    pass.ResultPath = 2
    runTest(v, obj, 2)

    pass.InputPath = 'foo'
    pass.ResultPath = 'bar'
    runTest(v, obj, 2)
  })

  it('Fail state', () => {
    // Fail state
    const fail = {
      Type: 'Fail',
      Cause: 'a',
      Error: 'b'
    }
    const pass = obj.States.pass

    delete pass.InputPath
    delete pass.ResultPath
    obj.States.fail = fail
    runTest(v, obj, 0)

    fail.InputPath = 'foo'
    fail.ResultPath = 'foo'
    runTest(v, obj, 4)

    delete fail.InputPath
    delete fail.ResultPath
    runTest(v, obj, 0)

    fail.Cause = false
    runTest(v, obj, 1)
    fail.Cause = 'ouch'
    runTest(v, obj, 0)
  })

  it('Task State', () => {
    const task = { Type: 'Task', Resource: 'a:b', Next: 'fail' }
    obj.States.task = task
    runTest(v, obj, 0)

    task.End = 'foo'
    runTest(v, obj, 1)

    task.End = true
    delete task.Next
    runTest(v, obj, 0)

    task.Resource = 11
    runTest(v, obj, 1)
    task.Resource = 'not a uri'
    runTest(v, obj, 1)

    task.Resource = 'foo:bar'
    task.TimeoutSeconds = 'x'
    task.HeartbeatSeconds = 3.9
    runTest(v, obj, -1)

    task.TimeoutSeconds = -2
    task.HeartbeatSeconds = 0
    runTest(v, obj, -1)

    task.TimeoutSeconds = 33
    task.HeartbeatSeconds = 44
    runTest(v, obj, 0)

    task.Retry = 1
    runTest(v, obj, 1)

    task.Retry = [ 1 ]
    runTest(v, obj, 1)

    task.Retry = [ { MaxAttempts: 0 }, { BackoffRate: 1.5 } ]
    runTest(v, obj, 2)

    task.Retry = [ { ErrorEquals: 1 }, { ErrorEquals: true } ]
    runTest(v, obj, 2)

    task.Retry = [ { ErrorEquals: [ 1 ] }, { ErrorEquals: [ true ] } ]
    runTest(v, obj, 2)

    task.Retry = [ { ErrorEquals: [ 'foo' ] }, { ErrorEquals: [ 'bar' ] } ]
    runTest(v, obj, 0)

    const rt = {
      ErrorEquals: [ 'foo' ],
      IntervalSeconds: 'bar',
      MaxAttempts: true,
      BackoffRate: {}
    }
    task.Retry = [ rt ]
    runTest(v, obj, 3)

    rt.IntervalSeconds = 0
    rt.MaxAttempts = -1
    rt.BackoffRate = 0.9
    runTest(v, obj, 3)

    rt.IntervalSeconds = 5
    rt.MaxAttempts = 99999999
    rt.BackoffRate = 1.1
    runTest(v, obj, 1)

    rt.MaxAttempts = 99999998
    runTest(v, obj, 0)

    const catchExpr = { ErrorEquals: [ 'foo' ], Next: 'n' }
    task.Catch = [ catchExpr ]
    runTest(v, obj, 0)

    delete catchExpr.Next
    runTest(v, obj, 1)

    catchExpr.Next = true
    runTest(v, obj, 1)

    catchExpr.Next = 't'
    delete catchExpr.ErrorEquals
    runTest(v, obj, 1)

    catchExpr.ErrorEquals = []
    runTest(v, obj, 0)

    catchExpr.ErrorEquals = [ 3 ]
    runTest(v, obj, 1)

    catchExpr.ErrorEquals = [ 'x' ]
  })

  describe('Choice', () => {
    const choice = {
      Type: 'Choice',
      Choices: [
        {
          Next: 'z',
          Variable: '$.a.b',
          StringLessThan: 'xx'
        }
      ],
      Default: 'x'
    }

    it('Choice state', () => {
      delete obj.States.task
      delete obj.States.fail

      obj.States['choice'] = choice
      runTest(v, obj, 0)

      choice.Next = 'a'
      runTest(v, obj, 1)
      delete choice.Next

      choice.End = true
      runTest(v, obj, 1)
      delete choice.End

      const choices = choice.Choices
      choice.Choices = []
      runTest(v, obj, 1)

      choice.Choices = [1, '2']
      runTest(v, obj, 2)
      choices.Next = 'y'
      choices.Variable = '$.c.d'
      choices.NumericEquals = 5
      choice.Choices = choices
      runTest(v, obj, 0)
    })

    it('Nester state', () => {
      const nester = { And: 'foo' }
      const choices = [nester]
      choice.Choices = choices
      runTest(v, obj, 2)

      nester.Next = 'x'
      runTest(v, obj, 1)
      nester.And = []
      runTest(v, obj, 1)

      nester.And = [
        {
          Variable: '$.a.b',
          StringLessThan: 'xx'
        },
        {
          Variable: '$.c.d',
          NumericEquals: 12
        },
        {
          Variable: '$.e.f',
          BooleanEquals: false
        }
      ]
      runTest(v, obj, 0)
    })

    it('Data types', () => {
      // data types
      const bad = [
        { Variable: '$.a', Next: 'b', StringEquals: 1 },
        { Variable: '$.a', Next: 'b', StringLessThan: true },
        { Variable: '$.a', Next: 'b', StringGreaterThan: 11.5 },
        { Variable: '$.a', Next: 'b', StringLessThanEquals: 0 },
        { Variable: '$.a', Next: 'b', StringGreaterThanEquals: false },
        { Variable: '$.a', Next: 'b', NumericEquals: 'a' },
        { Variable: '$.a', Next: 'b', NumericLessThan: true },
        { Variable: '$.a', Next: 'b', NumericGreaterThan: [3, 4] },
        { Variable: '$.a', Next: 'b', NumericLessThanEquals: {} },
        { Variable: '$.a', Next: 'b', NumericGreaterThanEquals: 'bar' },
        { Variable: '$.a', Next: 'b', BooleanEquals: 3 },
        { Variable: '$.a', Next: 'b', TimestampEquals: 'a' },
        { Variable: '$.a', Next: 'b', TimestampLessThan: 3 },
        { Variable: '$.a', Next: 'b', TimestampGreaterThan: true },
        { Variable: '$.a', Next: 'b', TimestampLessThanEquals: false },
        { Variable: '$.a', Next: 'b', TimestampGreaterThanEquals: 3 }
      ]
      const good = [
        { Variable: '$.a', Next: 'b', StringEquals: 'foo' },
        { Variable: '$.a', Next: 'b', StringLessThan: 'bar' },
        { Variable: '$.a', Next: 'b', StringGreaterThan: 'baz' },
        { Variable: '$.a', Next: 'b', StringLessThanEquals: 'foo' },
        { Variable: '$.a', Next: 'b', StringGreaterThanEquals: 'bar' },
        { Variable: '$.a', Next: 'b', NumericEquals: 11 },
        { Variable: '$.a', Next: 'b', NumericLessThan: 12 },
        { Variable: '$.a', Next: 'b', NumericGreaterThan: 13 },
        { Variable: '$.a', Next: 'b', NumericLessThanEquals: 14.3 },
        { Variable: '$.a', Next: 'b', NumericGreaterThanEquals: 14.4 },
        { Variable: '$.a', Next: 'b', BooleanEquals: false },
        { Variable: '$.a', Next: 'b', TimestampEquals: '2016-03-14T015900Z' },
        { Variable: '$.a', Next: 'b', TimestampLessThan: '2016-03-14T015900Z' },
        { Variable: '$.a', Next: 'b', TimestampGreaterThan: '2016-03-14T015900Z' },
        { Variable: '$.a', Next: 'b', TimestampLessThanEquals: '2016-03-14T015900Z' },
        { Variable: '$.a', Next: 'b', TimestampGreaterThanEquals: '2016-03-14T015900Z' }
      ]

      for (const comp of bad) {
        choice.Choices = [comp]
        runTest(v, obj, 1)
      }

      for (const comp of good) {
        choice.Choices = [comp]
        runTest(v, obj, 0)
      }
    })

    it('Nesting', () => {
      // nesting
      choice.Choices = [
        {
          Not: {
            Variable: '$.type',
            StringEquals: 'Private'
          },
          Next: 'Public'
        },
        {
          And: [
            {
              Variable: '$.value',
              NumericGreaterThanEquals: 20
            },
            {
              Variable: '$.value',
              NumericLessThan: 30
            }
          ],
          Next: 'ValueInTwenties'
        }
      ]
      runTest(v, obj, 0)

      choice.Choices = [
        {
          Not: {
            Variable: false,
            StringEquals: 'Private'
          },
          Next: 'Public'
        }
      ]
      runTest(v, obj, 1)

      choice.Choices = [
        {
          And: [
            {
              Variable: '$.value',
              NumericGreaterThanEquals: 20
            },
            {
              Variable: '$.value',
              NumericLessThan: 'foo'
            }
          ],
          Next: 'ValueInTwenties'
        }
      ]
      runTest(v, obj, 1)

      choice.Choices = [
        {
          And: [
            {
              Variable: '$.value',
              NumericGreaterThanEquals: 20,
              Next: 'x'
            },
            {
              Variable: '$.value',
              NumericLessThan: 44
            }
          ],
          Next: 'ValueInTwenties'
        }
      ]
      runTest(v, obj, 1)

      choice.Choices = [
        {
          And: [
            {
              Variable: '$.value',
              NumericGreaterThanEquals: 20,
              And: true
            },
            {
              Variable: '$.value',
              NumericLessThan: 44
            }
          ],
          Next: 'ValueInTwenties'
        }
      ]
      runTest(v, obj, 2)
      delete obj.States.choice
    })
  })

  it('Wait state', () => {
    const wait = {
      Type: 'Wait',
      Next: 'z',
      Seconds: 5
    }
    obj.States.wait = wait
    runTest(v, obj, 0)

    wait.Seconds = 't'
    runTest(v, obj, 1)
    delete wait.Seconds

    wait.SecondsPath = 12
    runTest(v, obj, 1)
    delete wait.SecondsPath

    wait.Timestamp = false
    runTest(v, obj, 1)
    delete wait.Timestamp

    wait.TimestampPath = 33
    runTest(v, obj, 1)
    delete wait.TimestampPath

    wait.Timestamp = '2016-03-14T015900Z'
    runTest(v, obj, 0)

    wait.Type = 'Wait'
    wait.Next = 'z'
    wait.Seconds = 5
    wait.SecondsPath = '$.x'
    runTest(v, obj, 1)

    delete obj.States.wait
  })

  it('Parallel state', () => {
    const para = {
      Type: 'Parallel',
      End: true,
      Branches: [
        {
          StartAt: 'p1',
          States: {
            'p1': {
              Type: 'Pass',
              End: true
            }
          }
        }
      ]
    }
    obj.States.parallel = para
    runTest(v, obj, 0)

    para.Branches[0].StartAt = true
    runTest(v, obj, 1)

    delete para.Branches
    runTest(v, obj, 1)

    para.Branches = 3
    runTest(v, obj, 1)

    para.Branches = []
    runTest(v, obj, 0)

    para.Branches = [ 3 ]
    runTest(v, obj, 1)

    para.Branches = [ { } ]
    runTest(v, obj, 2)

    para.Branches = [
      {
        StartAt: 'p1',
        States: {
          'p1': {
            Type: 'foo',
            End: true
          }
        }
      }
    ]

    runTest(v, obj, 2)
    para.Branches = [
      {
        foo: 1,
        StartAt: 'p1',
        States: {
          'p1': {
            Type: 'Pass',
            End: true
          }
        }
      }
    ]
    runTest(v, obj, 1)
    delete obj.States.parallel
  })
}

function tymlyExtensions (label, v, count) {
  it(label, () => {
    const tymlyObj = {
      namespace: 'Test',
      name: 'Trumpet',
      StartAt: 'pass',
      States: {
        pass: {
          Type: 'Pass',
          End: true
        }
      }
    }

    runTest(v, tymlyObj, count)
  })
}
/* function dump (problems) {
  console.log('\n')
  problems.forEach(problem => console.log(`P: ${problem}`))
} */

function runTest (v, obj, wantedErrorCount) {
  const json = JSON.parse(JSON.stringify(obj))

  const problems = v.validateDocument(json)
  if (wantedErrorCount !== -1) {
    if (problems.length !== wantedErrorCount) {
      problems.forEach(p => console.log(`P: ${p}`))
    }
    expect(problems.length).to.eql(wantedErrorCount)
  }
  return problems
}

function open (filepath) {
  return fs.openSync(require.resolve(filepath), 'r')
}
