class AllowedFields {
  constructor () {
    this.allowed = new Map()
  } // constructor

  setAllowed (role, child) {
    if (!this.allowed.has(role)) {
      this.allowed.set(role, [])
    }

    this.allowed.get(role).push(child)
  } // set_allowed

  isAllowed (roles, child) {
    return roles.some(role =>
      this.allowed.has(role) && this.allowed.get(role).includes(child)
    )
  }
} // class AllowedFields

module.exports = () => { return new AllowedFields() }
