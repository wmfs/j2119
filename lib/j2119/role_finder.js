const deduce = require('./deduce')

class RoleFinder {
  constructor () {
    // roles of the form: If an object with role X has field Y which
    //  is an object, that object has role R
    this.childRoles = new Map()

    // roles of the form: If an object with role X has field Y which
    //  is an object/array, the object-files/array-elements have role R
    this.grandchildRoles = new Map()

    // roles of the form: If an object with role X has a field Y with
    //  value Z, it has role R
    // map[role][field_name][field_val] => childRole
    this.fieldValueRoles = new Map()

    // roles of the form: If an object with role X has a field Y, then
    //  it has role R
    // map[role][field_name] => childRole
    this.fieldPresenceRoles = new Map()

    // roles of the form: A Foo is a Bar
    this.isARoles = new Map()
  } // constructor

  addIsARole (role, otherRole) {
    if (!this.isARoles.has(role)) this.isARoles.set(role, [])
    this.isARoles.get(role).push(otherRole)
  } // addIsARole

  addFieldValueRole (role, fieldName, fieldValue, newRole) {
    if (!this.fieldValueRoles.has(role)) this.fieldValueRoles.set(role, new Map())
    const roles = this.fieldValueRoles.get(role)
    if (!roles.has(fieldName)) roles.set(fieldName, new Map())

    fieldValue = deduce(fieldValue)
    this.fieldValueRoles.get(role).get(fieldName).set(fieldValue, newRole)
  } // addFieldValueRole

  addFieldPresenceRole (role, fieldName, newRole) {
    if (!this.fieldPresenceRoles.has(role)) this.fieldPresenceRoles.set(role, new Map())
    this.fieldPresenceRoles.get(role).set(fieldName, newRole)
  } // addFieldPresenceRole

  addChildRole (role, fieldName, childRole) {
    addDescendant(role, fieldName, childRole, this.childRoles)
  } // addChildRole

  addGrandchildRole (role, fieldName, grandchildRole) {
    addDescendant(role, fieldName, grandchildRole, this.grandchildRoles)
  } // addGrandchildRole

  findMoreRoles(node, roles) {
    // roles depending on field values
    roles.forEach(role => {
      const perFieldName =this.fieldValueRoles.get(role)
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
} // class RoleFinder

function addDescendant (role, fieldName, descendantRole, allDescendants) {
  if (!allDescendants.has(role)) allDescendants.set(role, { })
  allDescendants.get(role)[fieldName] = descendantRole
}

function descendantRoles (roles, fieldName, allDescendants) {
  return roles
    .map(role => allDescendants.get(role))
    .filter(descendants => !!descendants)
    .map(descendants => descendants[fieldName])
} // descendantRoles

module.exports = roleFinder => new RoleFinder()
