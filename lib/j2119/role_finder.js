const deduce = require('./deduce')

class RoleFinder {
  constructor () {
    // roles of the form: If an object with role X has field Y which
    //  is an object, that object has role R
    this.childRoles = mapOfMaps()

    // roles of the form: If an object with role X has field Y which
    //  is an object/array, the object-files/array-elements have role R
    this.grandchildRoles = mapOfMaps()

    // roles of the form: If an object with role X has a field Y with
    //  value Z, it has role R
    // map[role][field_name][field_val] => childRole
    this.fieldValueRoles = mapOfMaps()

    // roles of the form: If an object with role X has a field Y, then
    //  it has role R
    // map[role][field_name] => childRole
    this.fieldPresenceRoles = mapOfMaps()

    // roles of the form: A Foo is a Bar
    this.isARoles = mapOfArrays()
  } // constructor

  addIsARole (role, otherRole) {
    this.isARoles.getOrCreate(role).push(otherRole)
  } // addIsARole

  addFieldValueRole (role, fieldName, fieldValue, newRole) {
    fieldValue = deduce(fieldValue)
    this.fieldValueRoles.getOrCreate(role).getOrCreate(fieldName).set(fieldValue, newRole)
  } // addFieldValueRole

  addFieldPresenceRole (role, fieldName, newRole) {
    this.fieldPresenceRoles.getOrCreate(role).set(fieldName, newRole)
  } // addFieldPresenceRole

  addChildRole (role, fieldName, childRole) {
    this.childRoles.getOrCreate(role).set(fieldName, childRole)
  } // addChildRole

  addGrandchildRole (role, fieldName, grandchildRole) {
    this.grandchildRoles.getOrCreate(role).set(fieldName, grandchildRole)
  } // addGrandchildRole

  findMoreRoles (node, roles) {
    // roles depending on field values
    roles.forEach(role => {
      const perFieldName = this.fieldValueRoles.get(role)
      if (perFieldName) {
        perFieldName.forEach((valueRoles, fieldName) => {
          valueRoles.forEach((childRole, fieldValue) => {
            if (fieldValue === node[fieldName]) {
              roles.push(childRole)
            }
          })
        })
      }
    })

    // roles depending on field presence
    const nodeKeys = Object.keys(node)
    roles.forEach(role => {
      const perFieldName = this.fieldPresenceRoles.get(role)
      if (perFieldName) {
        perFieldName.forEach((childRole, fieldName) => {
          if (nodeKeys.includes(fieldName)) roles.push(childRole)
        })
      }
    })

    // is_a roles
    roles.forEach(role => {
      const otherRoles = this.isARoles.get(role)
      if (otherRoles) {
        roles.push(...otherRoles)
      }
    })
  } // findMoreRoles

  findChildRoles (roles, fieldName) {
    return descendantRoles(roles, fieldName, this.childRoles)
  } // findChildRoles

  // A node has a role, and one of its field is an object or an
  // array whose fields or elements are given a role
  findGrandchildRoles (roles, fieldName) {
    return descendantRoles(roles, fieldName, this.grandchildRoles)
  } // findGrandchildRoles

  toString () {
    let msg = 'Roles:'

    for (const [role, isA] of this.isARoles.entries()) {
      msg += `\n  ${role} is a ${isA.join()}`
    }

    return msg
  }
} // class RoleFinder

function descendantRoles (roles, fieldName, allDescendants) {
  return roles
    .map(role => allDescendants.get(role))
    .filter(descendants => !!descendants)
    .map(descendants => descendants.get(fieldName))
} // descendantRoles

function mapOfMaps () {
  const m = new Map()
  m.getOrCreate = function (key) {
    if (!this.has(key)) this.set(key, mapOfMaps())
    return this.get(key)
  }
  return m
} // mapOfMaps

function mapOfArrays () {
  const m = new Map()
  m.getOrCreate = function (key) {
    if (!this.has(key)) this.set(key, [])
    return this.get(key)
  }
  return m
} // mapOfArrays

module.exports = roleFinder => new RoleFinder()
