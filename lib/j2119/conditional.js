class RoleNotPresentCondition {
  constructor (excludeRoles) {
    this.excluded = excludeRoles
  } // constructor

  constraintApplies (node, roles) {
    return !this.excluded.some(role => roles.includes(role))
  }

  toString () {
    return `excluded roles: ${this.excluded}`
  }
} // class RoleNotPresentCondition

module.exports = {
  roleNotPresent: excludeRoles => new RoleNotPresentCondition(excludeRoles)
}
