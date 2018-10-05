/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

/*
GOOD = '{ ' +
       ' "StartAt": "x", ' +
       ' "States": {' +
       '  "x": {' +
       '    "Type": "Pass",' +
       '    "End": true ' +
       '  }' +
       ' } ' +
       '}'

SCHEMA = File.dirname(__FILE__) + '/../data/AWL.j2119'
*/

describe('J2119 Validator', () => {
  it('do this', () => fail())
  /*
    it 'should accept parsed JSON' do
      v = J2119::Validator.new SCHEMA
      j = JSON.parse GOOD
      p = v.validate j
      expect(p.empty?).to be true
    end

    it 'should accept JSON text' do
      v = J2119::Validator.new SCHEMA
      p = v.validate GOOD
      expect(p.empty?).to be true
    end

    it 'should read a JSON file' do
      v = J2119::Validator.new SCHEMA
      fn = "/tmp/#{$$}.tjf"
      f = File.open(fn, "w")
      f.write GOOD
      f.close

      p = v.validate fn
      File.delete fn
      expect(p.empty?).to be true
    end

    it 'should produce some sort of sane message with bad JSON' do
      v = J2119::Validator.new SCHEMA
      p = v.validate GOOD + 'x'
      expect(p.size).to eq(1)
    end

  end
  */
})