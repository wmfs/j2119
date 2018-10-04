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

// Verify that there is only one of a selection of fields
class OnlyOneOfConstraint extends Constraint {
  constructor (fields) {
    super()
    this.fields = fields
  } // constructor

  check (node, path, problems) {
    const selectionFields = Object.keys(node).filter(f => this.fields.includes(f))
    if (selectionFields.length > 1) {
      problems.push(`${path} may have only one of ${this.fields}`)
    }
  } // check
} // class OnlyOneOfConstraint

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

  toString () {
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

// Verify node does not have the named field
class DoesNotHaveFieldConstraint extends Constraint {
  constructor (name) {
    super()
    this.name = name
  } // constructor

  check (node, path, problems) {
    if (node[this.name]) {
      problems.push(`${path} have forbidden field "${this.name}"`)
    }
  } // check

  toString () {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    return `<Field ${this.names} should be absent${conds}`
  } // toString
} // class DoesNotHaveFieldConstructor

class FieldValueConstraint extends Constraint {
  constructor (name, params) {
    super()
    this.name = name
    this.params = params
  } // constructor

  check (node, path, problems) {
    // value checking is orthogonal to existence checking
    if (!Object.keys(node).includes(this.name)) return

    const value = node[this.name]

    if (this.params.enum) {
      if (!this.params.enum.includes(value)) {
        problems.push(`${path}.${this.name} is "${value}", not one of the allowed values ${this.params.enum}`)
      }

      return // if enum constraints are provided, others are ignored
    } // if enum ...

    if (this.params.equal) {
      if (value !== this.params.equal) {
        problems.push(`${path}.${this.name} is "${value}", but required value is ${this.params.equal}`)
      }
    } // if equal ...

    if (this.params.floor) {
      if (value <= this.params.floor) {
        problems.push(`${path}.${this.name} is "${value}", but allowed floor is ${this.params.floor}`)
      }
    } // if floor ...

    if (this.params.min) {
      if (value < this.params.min) {
        problems.push(`${path}.${this.name} is "${value}", but allowed minimum is ${this.params.min}`)
      }
    } // if min ...

    if (this.params.ceiling) {
      if (value >= this.params.ceiling) {
        problems.push(`${path}.${this.name} is "${value}", but allowed ceiling is ${this.params.ceiling}`)
      }
    } // if ceiling ...

    if (this.params.max) {
      if (value > this.params.max) {
        problems.push(`${path}.${this.name} is "${value}", but allowed max is ${this.params.max}`)
      }
    } // if max ...
  } // check

  toString () {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    return `<Field ${this.names} has constraints ${params}${conds}`
  } // toString

} // FieldValueConstraint

module.exports = {
  onlyOneOf: fields => new OnlyOneOfConstraint(fields),
  nonEmpty: name => new NonEmptyConstraint(name),
  hasField: names => new HasFieldConstraint(names),
  doesNotHaveField: name => new DoesNotHaveFieldConstraint(name),
  fieldValue: (name, params) => new FieldValueConstraint(name, params)
}
