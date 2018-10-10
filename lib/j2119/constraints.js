const DateTime = require('luxon').DateTime
const jsonPathChecker = require('./json_path_checker')
const TYPES = require('./types')

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

  toString () {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    return `<Node can have one of ${JSON.stringify(this.fields)} fields${conds}>`
  }
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
    return `<Array field ${this.name} should not be empty${conds}>`
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
    return `<Field ${this.names} should be present${conds}>`
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
    return `<Field ${this.name} should be absent${conds}>`
  } // toString
} // class DoesNotHaveFieldConstructor

// Verify type of a field in a node
class FieldTypeConstraint extends Constraint {
  constructor (name, type, isArray, isNullable) {
    super()
    this.name = name
    this.type = type
    this.isArray = isArray
    this.isNullable = isNullable
  } // constructor

  check (node, path, problems) {
    // type checking is orthogonal to existence checking
    if (!Object.keys(node).includes(this.name)) return

    const value = node[this.name]
    path = `${path}.${this.name}`

    if (value === null) {
      if (!this.isNullable) {
        problems.push(`${path} should be non-null`)
      }
      return
    }

    if (this.isArray) {
      if (Array.isArray(value)) {
        value.forEach((element, index) =>
          this.valueCheck(element, `${path}[${index}]`, problems)
        )
      } else {
        this.report(path, value, 'an Array', problems)
      }
    } else {
      this.valueCheck(value, path, problems)
    }
  } // check

  valueCheck (value, path, problems) {
    const report = message => this.report(path, value, message, problems)

    switch (this.type) {
      case TYPES.object:
        if (typeof value !== 'object' && !Array.isArray(value)) report('an Object')
        break
      case TYPES.array:
        if (!Array.isArray(value)) report('an Array')
        break
      case TYPES.string:
        if (typeof value !== 'string') report('a String')
        break
      case TYPES.integer:
        if (!Number.isInteger(value)) report('an Integer')
        break
      case TYPES.float:
        if (typeof value !== 'number' || Number.isInteger(value)) report('a Float')
        break
      case TYPES.boolean:
        if (typeof value !== 'boolean') report('a Boolean')
        break
      case TYPES.numeric:
        if (typeof value !== 'number') report('numeric')
        break
      case TYPES.JSONPath:
        if (!jsonPathChecker.isPath(value)) report('a JSONPath')
        break
      case TYPES.referencePath:
        if (!jsonPathChecker.isReferencePath(value)) report('a Reference Path')
        break
      case TYPES.timestamp:
        const ts = DateTime.fromISO(value)
        if (!ts.isValid) report('an ISO8601 timestamp') // Spec actually says RFC3339, but close enough
        break
      case TYPES.URI:
        if ((typeof value !== 'string') || (!value.match(/^[a-z]+:/))) report('a URI')
        break
    }
  } // valueCheck

  report (path, value, message, problems) {
    if (typeof value === 'string') {
      value = `"${value}"`
    }
    problems.push(`${path} is ${value} but should be ${message}`)
  } // report

  toString () {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    const nullable = this.isNullable ? ' (nullable)' : ''
    return `<Field ${this.name} should be of type ${this.type}${conds}>${nullable}`
  }
} // class FieldTypeConstraint

// Verify constraints on values of a named field
class FieldValueConstraint extends Constraint {
  constructor (name, params) {
    super()
    this.name = name
    this.params = new Map(Object.entries(params))
  } // constructor

  check (node, path, problems) {
    // value checking is orthogonal to existence checking
    if (!Object.keys(node).includes(this.name)) return

    const value = node[this.name]

    if (this.params.has('enum')) {
      if (!this.params.get('enum').includes(value)) {
        problems.push(`${path}.${this.name} is "${value}", not one of the allowed values ${this.params.get('enum')}`)
      }

      return // if enum constraints are provided, others are ignored
    } // if enum ...

    if (this.params.has('equal')) {
      if (value !== this.params.get('equal')) {
        problems.push(`${path}.${this.name} is "${value}", but required value is ${this.params.get('equal')}`)
      }
    } // if equal ...

    if (this.params.has('floor')) {
      if (value <= this.params.get('floor')) {
        problems.push(`${path}.${this.name} is "${value}", but allowed floor is ${this.params.get('floor')}`)
      }
    } // if floor ...

    if (this.params.has('min')) {
      if (value < this.params.get('min')) {
        problems.push(`${path}.${this.name} is "${value}", but allowed minimum is ${this.params.get('min')}`)
      }
    } // if min ...

    if (this.params.has('ceiling')) {
      if (value >= this.params.get('ceiling')) {
        problems.push(`${path}.${this.name} is "${value}", but allowed ceiling is ${this.params.get('ceiling')}`)
      }
    } // if ceiling ...

    if (this.params.has('max')) {
      if (value > this.params.get('max')) {
        problems.push(`${path}.${this.name} is "${value}", but allowed max is ${this.params.get('max')}`)
      }
    } // if max ...
  } // check

  toString () {
    const conds = this.conditions.length ? ` ${this.conditions.length} conditions` : ''
    return `<Field ${this.name} has constraints ${JSON.stringify(strMapToObj(this.params))}${conds}>`
  } // toString
} // FieldValueConstraint

function strMapToObj (strMap) {
  const obj = { }
  for (const [ k, v ] of strMap) {
    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    obj[k] = v
  }
  return obj
} // strMapToObj

module.exports = {
  onlyOneOf: fields => new OnlyOneOfConstraint(fields),
  nonEmpty: name => new NonEmptyConstraint(name),
  hasField: names => new HasFieldConstraint(names),
  doesNotHaveField: name => new DoesNotHaveFieldConstraint(name),
  fieldType: (name, type, isArray, isNullable) => new FieldTypeConstraint(name, type, isArray, isNullable),
  fieldValue: (name, params) => new FieldValueConstraint(name, params)
}
