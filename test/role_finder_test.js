/* eslint-env mocha */

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const roleFinder = require('../lib/j2119/role_finder')

describe('J2119 RoleFinder', () => {
  it('should successfully assign an additional role based on a role', () => {
    const cut = roleFinder()
    const json = JSON.parse('{"a": 3}')
    cut.addIsARole('OneRole', 'AnotherRole')
    const roles = [ 'OneRole' ]
    cut.findMoreRoles(json, roles)
    expect(roles.length).to.equal(2)
    expect(roles.includes('AnotherRole')).to.be.true()
  })

  it('should successfully assign a role based on field value', () => {
    const cut = roleFinder()
    const json = JSON.parse('{"a": 3}')
    cut.addFieldValueRole('MyRole', 'a', '3', 'NewRole')
    const roles = [ 'MyRole' ]
    cut.findMoreRoles(json, roles)
    expect(roles.length).to.equal(2)
    expect(roles.includes('NewRole')).to.be.true()
  })

  it('should successfully assign a role based on field presence', () => {
    const cut = roleFinder()
    const json = JSON.parse('{"a": 3}')
    cut.addFieldPresenceRole('MyRole', 'a', 'NewRole')
    const roles = [ 'MyRole' ]
    cut.findMoreRoles(json, roles)
    expect(roles.length).to.equal(2)
    expect(roles.includes('NewRole')).to.be.true()
  })

  it('should successfully add a role to a grandchild field based on its name', () => {
    const cut = roleFinder()
    cut.addGrandchildRole('MyRole', 'a', 'NewRole')
    const roles = [ 'MyRole' ]
    const grandchildRoles = cut.findGrandchildRoles(roles, 'a')
    expect(grandchildRoles.length).to.equal(1)
    expect(grandchildRoles.includes('NewRole')).to.be.true()
  })

  it('should successfully add a role to a child field based on its name', () => {
    const cut = roleFinder()
    cut.addChildRole('MyRole', 'a', 'NewRole')
    const roles = [ 'MyRole' ]
    const childRoles = cut.findChildRoles(roles, 'a')
    expect(childRoles.length).to.equal(1)
    expect(childRoles.includes('NewRole')).to.be.true()
  })
})
