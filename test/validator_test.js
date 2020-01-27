/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const validator = require('../lib')

const STATE_MACHINE = {
  StartAt: 'x',
  States: {
    x: {
      Type: 'Pass',
      End: true
    }
  }
}

const WITH_NULL_RESULT_PATH = {
  StartAt: 'x',
  States: {
    x: {
      Type: 'Pass',
      ResultPath: null,
      End: true
    }
  }
}

const WITH_ARRAY_RESULT = {
  StartAt: 'No-op',
  States: {
    'No-op': {
      Type: 'Pass',
      ResultPath: '$.coords',
      Result: [
        'foo',
        'bar',
        {
          bazz: 123
        }
      ],
      End: true
    }
  }
}

const WITH_OBJECT_RESULT = {
  StartAt: 'No-op',
  States: {
    'No-op': {
      Type: 'Pass',
      ResultPath: '$.coords',
      Result: {
        foo: {
          'x-datum': 0.381018,
          'y-datum': 622.2269926397355
        }
      },
      End: true
    }
  }
}

const STATE_MACHINE_WITH_RESOURCE_CONFIG_OBJECT = {
  StartAt: 'x',
  States: {
    x: {
      Type: 'Task',
      Resource: 'module:monkeyPunk',
      ResourceConfig: {
        param: 'tree',
        obj: {
          x: 'X',
          y: {
            down: {
              deep: {
                and: {
                  deeper: {
                    and: {
                      deeper: {
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      End: true
    }
  },
  namespace: 'Test',
  name: 'Extension'
}

const STATE_MACHINE_WITH_RESOURCE_CONFIG_ARRAY = {
  StartAt: 'x',
  States: {
    x: {
      Type: 'Task',
      Resource: 'module:monkeyPunk',
      ResourceConfig: [
        'param',
        {
          x: 'X',
          y: {
            down: {
              deep: {
                and: {
                  deeper: {
                    and: {
                      deeper: {
                      }
                    }
                  }
                }
              }
            }
          }
        },
        1,
        true
      ],
      End: true
    }
  },
  namespace: 'Test',
  name: 'Extension'
}

const SCHEMA = require.resolve('./fixtures/AWL.j2119')
const EXTENSION = require.resolve('./fixtures/TymlyExtension.j2119')
const ALTERNAEXTENSION = require.resolve('./fixtures/AlternaTymlyExtension.j2119')
const BAD = require.resolve('./fixtures/Bad.j2119')

describe('J2119 Validator', () => {
  it('validate parsed JSON', () => {
    const v = validator(SCHEMA)
    const p = v.validate(STATE_MACHINE)
    expect(p.length).to.eql(0)
  })

  it('validate state machine with null result path', () => {
    const v = validator(SCHEMA)
    const p = v.validate(WITH_NULL_RESULT_PATH)
    expect(p.length).to.eql(0)
  })

  it('validate state machine with result object', () => {
    const v = validator(SCHEMA)
    const p = v.validate(WITH_OBJECT_RESULT)
    expect(p.length).to.eql(0)
  })

  it('validate state machine with result array', () => {
    const v = validator(SCHEMA)
    const p = v.validate(WITH_ARRAY_RESULT)
    expect(p.length).to.eql(0)
  })

  it('fail to validate a text string', () => {
    const v = validator(SCHEMA)
    const p = v.validate('{ "States": "WHOOPS I AM A STRING }')
    expect(p.length).to.eql(1)
  })

  it('fail to validate an array', () => {
    const v = validator(SCHEMA)
    const p = v.validate([STATE_MACHINE])
    expect(p.length).to.eql(1)
  })

  it('should produce some sort of sane message with bad JSON', () => {
    const v = validator(SCHEMA)
    const p = v.validate({})
    expect(p.length).to.not.eql(0)
  })

  it('produce a nice string', () => {
    const s = validator(SCHEMA).toString()
    expect(s).to.not.contain('[object')
  })

  describe('load an Tymly extension', () => {
    const v = validator(SCHEMA, EXTENSION)

    it('missing extension elements', () => {
      const p = v.validate(STATE_MACHINE)
      expect(p.length).to.eql(2) // missing extensions!
    })

    it('resource config object is valid', () => {
      const np = v.validate(STATE_MACHINE_WITH_RESOURCE_CONFIG_OBJECT)
      expect(np.length).to.eql(0)
    })

    it('resource config array is not valid', () => {
      const nnp = v.validate(STATE_MACHINE_WITH_RESOURCE_CONFIG_ARRAY)
      expect(nnp.length).to.eql(1)
    })
  })
  describe('load an AlternaTymly extension', () => {
    const v = validator(SCHEMA, ALTERNAEXTENSION)

    it('missing extension elements', () => {
      const p = v.validate(STATE_MACHINE)
      expect(p.length).to.eql(2) // missing extensions!
    })

    it('resource config object is valid', () => {
      const np = v.validate(STATE_MACHINE_WITH_RESOURCE_CONFIG_OBJECT)
      expect(np.length).to.eql(1)
    })

    it('resource config array is not valid', () => {
      const nnp = v.validate(STATE_MACHINE_WITH_RESOURCE_CONFIG_ARRAY)
      expect(nnp.length).to.eql(0)
    })
  })

  it('report when unable to load', () => {
    expect(() => validator(SCHEMA, 'chuckle-brothers')).to.throw('no such file')
    expect(() => validator(SCHEMA, BAD)).to.throw('Could not extend parser')
    expect(() => validator(SCHEMA, EXTENSION, BAD)).to.throw('Could not extend parser')
    expect(() => validator(BAD)).to.throw('Could not create parser')
  })
})
