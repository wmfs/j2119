class RoleConstraints {
  constructor () {
    this.constraints = new Map()
  }

  add (role, constraint) {
    if (!this.constraints.has(role)) this.constraints.set(role, [])

    this.constraints.get(role).push(constraint)
  } // add

  getConstraints (role) {
    return this.constraints.has(role)
      ? this.constraints.get(role)
      : [ ]
  } // getConstraints
} // class RoleConstraints

module.exports = () => new RoleConstraints()
