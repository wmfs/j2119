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
  })

  describe('should read definitions', () => {
    const f = fs.openSync('data/AWL.j2119', 'r')
    const p = parser(f)
    const v = nodeValidator(p)
    explore(v, p)
  })
})

function explore (v, p) {
  // just gonna run through the state machine spec exercising each
  //  constraint

  const obj = { StartAt: 'pass' }

  it ('root', () => {
    run_test(v, p, obj, 1)

    delete obj.StartAt
    obj.States = {}
    run_test(v, p, obj, 1)

    obj.StartAt = 'pass'
    run_test(v, p, obj, 0)

    obj.Version = 3
    run_test(v, p, obj, 1)

    obj.Version = '1.0'
    obj.Comment = true
    run_test(v, p, obj, 1)

    obj.Comment = 'Hi'
    const states = obj.States
    states.pass = {}
    run_test(v, p, obj, 2)
  })

  it('Pass state', () => {
    // Pass state & general
    const pass = obj.States.pass
    pass.Next = 's1'
    pass.Type = 'Pass'

    run_test(v, p, obj, 0)

    pass.Type = 'flibber'
    run_test(v, p, obj, 1)

    pass.Type = 'Pass'
    pass.Comment = 23.5
    run_test(v, p, obj, 1)

    pass.Type = 'Pass'
    pass.Comment = ''
    run_test(v, p, obj, 0)

    pass.Type = 'Pass'
    pass.Comment = ''
    pass.End = 11
    run_test(v, p, obj, 1)

    pass.End = true
    run_test(v, p, obj, -1)

    delete pass.Next
    run_test(v, p, obj, 0)

    pass.InputPath = 1
    pass.ResultPath = 2
    run_test(v, p, obj, 2)

    pass.InputPath = 'foo'
    pass.ResultPath = 'bar'
    run_test(v, p, obj, 2)
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
    run_test(v, p, obj, 0)

    fail.InputPath = 'foo'
    fail.ResultPath = 'foo'
    run_test(v, p, obj, 4)

    delete fail.InputPath
    delete fail.ResultPath
    run_test(v, p, obj, 0)

    fail.Cause = false
    run_test(v, p, obj, 1)
    fail.Cause = 'ouch'
    run_test(v, p, obj, 0)
  })

  it('Task State', () => {
    const task = { Type: 'Task', Resource: 'a:b', Next: 'fail' }
    obj.States.task = task
    run_test(v, p, obj, 0)

    task.End = 'foo'
    run_test(v, p, obj, 1)

    task.End = true
    delete task.Next
    run_test(v, p, obj, 0)

    task.Resource = 11
    run_test(v, p, obj, 1)
    task.Resource = 'not a uri'
    run_test(v, p, obj, 1)

    task.Resource = 'foo:bar'
    task.TimeoutSeconds = 'x'
    task.HeartbeatSeconds = 3.9
    run_test(v, p, obj, -1)

    task.TimeoutSeconds = -2
    task.HeartbeatSeconds = 0
    run_test(v, p, obj, -1)

    task.TimeoutSeconds = 33
    task.HeartbeatSeconds = 44
    run_test(v, p, obj, 0)

    task.Retry = 1
    run_test(v, p, obj, 1)

    task.Retry = [ 1 ]
    run_test(v, p, obj, 1)

    task.Retry = [ { MaxAttempts: 0 }, { BackoffRate: 1.5 } ]
    run_test(v, p, obj, 2)

    task.Retry = [ { ErrorEquals: 1 }, { ErrorEquals: true } ]
    run_test(v, p, obj, 2)

    task.Retry = [ { ErrorEquals: [ 1 ] }, { ErrorEquals: [ true ] } ]
    run_test(v, p, obj, 2)

    task.Retry = [ { ErrorEquals: [ 'foo' ] }, { ErrorEquals: [ 'bar' ] } ]
    run_test(v, p, obj, 0)

    const rt = {
      ErrorEquals: [ 'foo' ],
      IntervalSeconds: 'bar',
      MaxAttempts: true,
      BackoffRate: {}
    }
    task.Retry = [ rt ]
    run_test(v, p, obj, 3)

    rt.IntervalSeconds = 0
    rt.MaxAttempts = -1
    rt.BackoffRate = 0.9
    run_test(v, p, obj, 3)

    rt.IntervalSeconds = 5
    rt.MaxAttempts = 99999999
    rt.BackoffRate = 1.1
    run_test(v, p, obj, 1)

    rt.MaxAttempts = 99999998
    run_test(v, p, obj, 0)

    const catchExpr = { ErrorEquals: [ 'foo' ], Next: 'n' }
    task.Catch = [ catchExpr ]
    run_test(v, p, obj, 0)

    delete catchExpr.Next
    run_test(v, p, obj, 1)

    catchExpr.Next = true
    run_test(v, p, obj, 1)

    catchExpr.Next = 't'
    delete catchExpr.ErrorEquals
    run_test(v, p, obj, 1)

    catchExpr.ErrorEquals = []
    run_test(v, p, obj, 0)

    catchExpr.ErrorEquals = [ 3 ]
    run_test(v, p, obj, 1)

    catchExpr.ErrorEquals = [ 'x' ]
  })

  describe('Choice', () => {
      const choice = {
        Type:'Choice',
        Choices:[
          {
            Next:'z',
            Variable:'$.a.b',
            StringLessThan:'xx'
          }
        ],
        Default:'x'
      }

    it('Choice state', () => {
      delete obj.States.task
      delete obj.States.fail

      obj.States['choice'] = choice
      run_test(v, p, obj, 0)

      choice.Next = 'a'
      run_test(v, p, obj, 1)
      delete choice.Next

      choice.End = true
      run_test(v, p, obj, 1)
      delete choice.End

      const choices = choice.Choices
      choice.Choices = []
      run_test(v, p, obj, 1)

      choice.Choices = [1, "2"]
      run_test(v, p, obj, 2)
      choices.Next = 'y'
      choices.Variable = '$.c.d'
      choices.NumericEquals = 5
      choice.Choices = choices
      run_test(v, p, obj, 0)
    })

    it('Nester state', () => {
      const nester = {And: 'foo'}
      const choices = [nester]
      choice.Choices = choices
      run_test(v, p, obj, 2)

      nester.Next = 'x'
      run_test(v, p, obj, 1)
      nester.And = []
      run_test(v, p, obj, 1)

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
      run_test(v, p, obj, 0)
    })

    it('Data types', () => {
      // data types
      const bad = [
        {Variable: '$.a', Next: 'b', StringEquals: 1},
        {Variable: '$.a', Next: 'b', StringLessThan: true},
        {Variable: '$.a', Next: 'b', StringGreaterThan: 11.5},
        {Variable: '$.a', Next: 'b', StringLessThanEquals: 0},
        {Variable: '$.a', Next: 'b', StringGreaterThanEquals: false},
        {Variable: '$.a', Next: 'b', NumericEquals: 'a'},
        {Variable: '$.a', Next: 'b', NumericLessThan: true},
        {Variable: '$.a', Next: 'b', NumericGreaterThan: [3, 4]},
        {Variable: '$.a', Next: 'b', NumericLessThanEquals: {}},
        {Variable: '$.a', Next: 'b', NumericGreaterThanEquals: 'bar'},
        {Variable: '$.a', Next: 'b', BooleanEquals: 3},
        {Variable: '$.a', Next: 'b', TimestampEquals: 'a'},
        {Variable: '$.a', Next: 'b', TimestampLessThan: 3},
        {Variable: '$.a', Next: 'b', TimestampGreaterThan: true},
        {Variable: '$.a', Next: 'b', TimestampLessThanEquals: false},
        {Variable: '$.a', Next: 'b', TimestampGreaterThanEquals: 3}
      ]
      const good = [
        {Variable: '$.a', Next: 'b', StringEquals: 'foo'},
        {Variable: '$.a', Next: 'b', StringLessThan: 'bar'},
        {Variable: '$.a', Next: 'b', StringGreaterThan: 'baz'},
        {Variable: '$.a', Next: 'b', StringLessThanEquals: 'foo'},
        {Variable: '$.a', Next: 'b', StringGreaterThanEquals: 'bar'},
        {Variable: '$.a', Next: 'b', NumericEquals: 11},
        {Variable: '$.a', Next: 'b', NumericLessThan: 12},
        {Variable: '$.a', Next: 'b', NumericGreaterThan: 13},
        {Variable: '$.a', Next: 'b', NumericLessThanEquals: 14.3},
        {Variable: '$.a', Next: 'b', NumericGreaterThanEquals: 14.4},
        {Variable: '$.a', Next: 'b', BooleanEquals: false},
        {Variable: '$.a', Next: 'b', TimestampEquals: "2016-03-14T015900Z"},
        {Variable: '$.a', Next: 'b', TimestampLessThan: "2016-03-14T015900Z"},
        {Variable: '$.a', Next: 'b', TimestampGreaterThan: "2016-03-14T015900Z"},
        {Variable: '$.a', Next: 'b', TimestampLessThanEquals: "2016-03-14T015900Z"},
        {Variable: '$.a', Next: 'b', TimestampGreaterThanEquals: "2016-03-14T015900Z"}
      ]

      for (const comp of bad) {
        choice.Choices = [comp]
        run_test(v, p, obj, 1)
      }

      for (const comp of good) {
        choice.Choices = [comp]
        run_test(v, p, obj, 1)
      }
    })

    it('Nesting', () => {
      // nesting
      choice.Choices = [
        {
          Not: {
            Variable: "$.type",
            StringEquals: "Private"
          },
          Next: "Public"
        },
        {
          And: [
            {
              Variable: "$.value",
              NumericGreaterThanEquals: 20
            },
            {
              Variable: "$.value",
              NumericLessThan: 30
            }
          ],
          Next: "ValueInTwenties"
        }
      ]
      run_test(v, p, obj, 0)

      choice.Choices = [
        {
          Not: {
            Variable: false,
            StringEquals: "Private"
          },
          Next: "Public"
        }
      ]
      run_test(v, p, obj, 1)

      choice.Choices = [
        {
          And: [
            {
              Variable: "$.value",
              NumericGreaterThanEquals: 20
            },
            {
              Variable: "$.value",
              NumericLessThan: 'foo'
            }
          ],
          Next: "ValueInTwenties"
        }
      ]
      run_test(v, p, obj, 1)

      choice.Choices = [
        {
          And: [
            {
              Variable: "$.value",
              NumericGreaterThanEquals: 20,
              Next: "x"
            },
            {
              Variable: "$.value",
              NumericLessThan: 44
            }
          ],
          Next: "ValueInTwenties"
        }
      ]
      run_test(v, p, obj, 1)

      choice.Choices = [
        {
          And: [
            {
              Variable: "$.value",
              NumericGreaterThanEquals: 20,
              And: true
            },
            {
              Variable: "$.value",
              NumericLessThan: 44
            }
          ],
          Next: "ValueInTwenties"
        }
      ]
      run_test(v, p, obj, 2)
      delete obj.States.choice
    })
  })

    /*
      # Wait state
      states['wait' = {
        :Type => 'Wait',
        :Next => 'z',
        :Seconds => 5
      }
      run_test(v, p, obj, 0)

      states['wait'].Seconds = 't'
      run_test(v, p, obj, 1)
      states['wait'].delete :Seconds
      states['wait'].SecondsPath = 12
      run_test(v, p, obj, 1)
      states['wait'].delete :SecondsPath
      states['wait'].Timestamp = false
      run_test(v, p, obj, 1)
      states['wait'].delete :Timestamp
      states['wait'].TimestampPath = 33
      run_test(v, p, obj, 1)
      states['wait'].delete :TimestampPath
      states['wait'].Timestamp = "2016-03-14T01:59:00Z"
      run_test(v, p, obj, 0)

      states['wait' = {
        :Type => 'Wait',
        :Next => 'z',
        :Seconds => 5,
        :SecondsPath => '$.x'
      }
      run_test(v, p, obj, 1)
      states.delete 'wait'

      para = {
        :Type => 'Parallel',
        :End => true,
        :Branches => [
          {
            :StartAt => 'p1',
            :States => {
              'p1' => {
                :Type => 'Pass',
                :End => true
              }
            }
          }
        ]
      }
      states['parallel' = para
      run_test(v, p, obj, 0)

      para.Branches][0].StartAt = true
      run_test(v, p, obj, 1)

      para.delete :Branches
      run_test(v, p, obj, 1)

      para.Branches = 3
      run_test(v, p, obj, 1)

      para.Branches = []
      run_test(v, p, obj, 0)

      para.Branches = [ 3 ]
      run_test(v, p, obj, 1)

      para.Branches = [ { } ]
      run_test(v, p, obj, 2)

      para.Branches] =[
        {
          :StartAt => 'p1',
          :States => {
            'p1' => {
              :Type => 'foo',
              :End => true
            }
          }
        }
      ]

      run_test(v, p, obj, 2)
      para.Branches] =[
        {
          :foo => 1,
          :StartAt => 'p1',
          :States => {
            'p1' => {
              :Type => 'Pass',
              :End => true
            }
          }
        }
      ]
      run_test(v, p, obj, 1)
    end

  */
}

function dump (problems) {
  console.log('\n')
  problems.forEach(problem => console.log(`P: ${problem}`))
}

function run_test (v, p, obj, wanted_error_count, wanted_strings = []) {
  const problems = []
  const json = JSON.parse(JSON.stringify(obj))

  v.validateNode(json, p.root, [p.root], problems)
  if (wanted_error_count != -1) {
    expect(problems.length).to.eql(wanted_error_count)
  }
  return problems
}
