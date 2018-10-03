class Constraint {
  constructor () {
    this.conditions = []
  } // constructor

  addCondition (condition) {
    this.conditions.push(condition)
  } // addCondition

  applies (node, role) {
    return (this.conditions.length === 0) ||
      this.conditions.some(c => c.constraintApplies(node, role))
  } // applies
} // class Constraint

// Verify that array field is not empty
class NonEmptyConstraint extends Constraint {
  constructor (name) {
    super()
    this.name = name
  } // constructor

  check (node, path, problems) {
    const a = node[this.name]
    if (Array.isArray(a) && a.length === 0) {
      problems.push(`${path}.${this.name} is empty, non-empty required`)
    }
  } // check

  toString() {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    return `<Array field ${this.names} should not be empty${conds}`
  }
} // class NonEmptyConstraint

// Verify node has the named field, or one of the named fields
class HasFieldConstraint extends Constraint {
  constructor (names) {
    super()
    this.names = Array.isArray(names) ? names : [ names ]
  } // constructor

  check (node, path, problems) {
    const keys = Object.keys(node)
    if (!this.names.some(name => keys.includes(name))) {
      problems.push(`${path} does not have required field ` +
        (this.names.length === 1 ? `"${this.names[0]}"` : `from ${this.names}`)
      )
    } // if ...
  } // check

  toString () {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    return `<Field ${this.names} should be present${conds}`
  } // toString
} // HasFieldConstraint

module.exports = {
  nonEmpty: name => new NonEmptyConstraint(name),
  hasField: names => new HasFieldConstraint(names)
}