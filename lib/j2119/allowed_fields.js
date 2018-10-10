class AllowedFields {
  constructor () {
    this.allowed = new Map()
    this.any = [ ]
  } // constructor

  setAllowed (role, child) {
    if (!this.allowed.has(role)) {
      this.allowed.set(role, [])
    }

    this.allowed.get(role).push(child)
  } // set_allowed

  setAny (role) {
    this.any.push(role)
  } // setAny

  isAllowed (roles, child) {
    const any = this.allowsAny(roles)
    return any || roles.some(role =>
      this.allowed.has(role) && this.allowed.get(role).includes(child)
    )
  } // isAllowed

  allowsAny (roles) {
    return roles.some(role =>
      this.any.includes(role)
    )
  } // allowsAny

  toString () {
    let msg = 'Allowed fields: '
    this.allowed.forEach((fields, role) => {
      msg += `\n  ${role} => ${fields.join()}`
    })
    this.any.forEach(role => {
      msg += `\n  ${role} => any fields`
    })
    return msg
  }
} // class AllowedFields

module.exports = () => { return new AllowedFields() }
