const oxford = require('./oxford')
const conditional = require('./conditional')
const constraint = require('./constraints')
const deduce = require('./deduce')
const TYPES = require('./types')

class Assigner {
  constructor (roleConstraints, roleFinder, matcher, allowedFields) {
    this.constraints = roleConstraints
    this.roles = roleFinder
    this.matcher = matcher
    this.allowedFields = allowedFields
  } // constructor

  assignRoles (assertion) {
    if (assertion['val_match_present']) {
      this.roles.addFieldValueRole(
        assertion['role'],
        assertion['fieldtomatch'],
        assertion['valtomatch'],
        assertion['newrole']
      )
      this.matcher.addRole(assertion['newrole'])
    } else if (assertion['with_a_field']) {
      this.roles.addFieldPresenceRole(
        assertion['role'],
        assertion['with_a_field'],
        assertion['newrole']
      )
      this.matcher.addRole(assertion['newrole'])
    } else {
      this.roles.addIsARole(
        assertion['role'],
        assertion['newrole']
      )
      this.matcher.addRole(assertion['newrole'])
    }
  } // assignRoles

  assignOnlyOneOf (assertion) {
    const role = assertion['role']
    const values = oxford.breakStringList(assertion['field_list'])
    this.addConstraint(role, constraint.onlyOneOf(values), null)
  } // assignOnlyOneOf

  assignConstraints (assertion) {
    const role = assertion['role']
    const modal = assertion['modal']
    const type = assertion['type']
    const fieldName = assertion['field_name']
    const fieldListString = assertion['field_list']
    const relation = assertion['relation']
    const target = assertion['target']
    const strings = assertion['strings']

    // watch out for conditionals
    let condition = null
    if (assertion['excluded']) {
      const excludedRoles = oxford.breakRoleList(this.matcher, assertion['excluded'])
      condition = conditional.roleNotPresent(excludedRoles)
    }

    if (relation) {
      this.addRelationConstraint(role, fieldName, relation, target, condition)
    }

    if (strings) {
      // of the form MUST have a <type> field named <fieldName> whose value
      //  MUST be one of "a", "b", or "c"
      const fields = oxford.breakStringList(strings)
      this.addConstraint(role, constraint.fieldValue(fieldName, { enum: fields }), condition)
    }

    if (type) {
      this.addTypeConstraints(role, fieldName, type, condition)
    }

    const fieldList = fieldListString ? oxford.breakStringList(fieldListString) : null

    // register allowed fields
    if (fieldListString) {
      fieldList.forEach(field => this.allowedFields.setAllowed(role, field))
    } else if (fieldName) {
      this.allowedFields.setAllowed(role, fieldName)
    }

    if (modal === 'MUST') {
      if (fieldListString) {
        // Of the form MUST have a <type>? field named one of "a", "b", or "c".
        this.addConstraint(role, constraint.hasField(fieldList), condition)
      } else {
        this.addConstraint(role, constraint.hasField(fieldName), condition)
      }
    } else if (modal === 'MUST NOT') {
      this.addConstraint(role, constraint.doesNotHaveField(fieldName), condition)
    }

    // there can be role defs there too
    const childType = assertion['child_type']
    if (childType) {
      const childRole = assertion['child_role']
      this.matcher.addRole(childRole)
      if (childType === 'value') {
        this.roles.addChildRole(role, fieldName, childRole)
      } else if (childType === 'element' || childType === 'field') {
        this.roles.addGrandchildRole(role, fieldName, childRole)
      }
    }

    // object field without a defined child role
    if (fieldName && !childType && type === TYPES.object) {
      this.roles.addGrandchildRole(role, fieldName, fieldName)
      this.allowedFields.setAny(fieldName)
    }
  } // assignConstraints

  addConstraint (role, constraint, condition) {
    if (condition) {
      constraint.addCondition(condition)
    }
    this.constraints.add(role, constraint)
  } // addConstraint

  addRelationConstraint (role, field, relation, target, condition) {
    target = deduce(target)

    const operations = {
      'equal to': 'equal',
      'greater than': 'floor',
      'less than': 'ceiling',
      'greater than or equal to': 'min',
      'less than or equal to': 'max'
    }

    const op = operations[relation]
    const params = { [op]: target }

    this.addConstraint(role, constraint.fieldValue(field, params), condition)
  } // addRelationConstraint

  addTypeConstraints (role, field, type, condition) {
    const isArray = (type.indexOf('-array') !== -1)
    const isNullable = (type.indexOf('nullable-') !== -1)

    const valueOperations = {
      positive: 'floor',
      nonnegative: 'min',
      negative: 'ceiling'
    }

    for (const part of type.split('-')) {
      if (TYPES.includes(part)) {
        if (part === TYPES.array && isArray) return

        this.addConstraint(
          role,
          constraint.fieldType(field, part, isArray, isNullable),
          condition
        )
      } // if type ...
      if (valueOperations[part]) {
        this.addConstraint(
          role,
          constraint.fieldValue(field, { [valueOperations[part]]: 0 }),
          condition
        )
      } // if value ...
      if (part === 'nonempty') {
        this.addConstraint(
          role,
          constraint.nonEmpty(field),
          condition
        )
      }
    } // for ...
  } // addTypeConstraints
} // class Assigner

module.exports = (roleConstraints, roleFinder, matcher, allowedFields) =>
  new Assigner(roleConstraints, roleFinder, matcher, allowedFields)
