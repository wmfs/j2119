const oxford = require('./oxford')
const conditional = require('./conditional')
const constraint = require('./constraints')

class Assigner {
  constructor (roleConstraints, roleFinder, matcher, allowedFields) {
    this.constraints = roleConstraints
    this.roles = roleFinder
    this.matcher = matcher
    this.allowedFields = allowedFields
  } // constructor

  assignConstraints (assertion) {
    const role = assertion['role']
    const modal = assertion['modal']
    const type = assertion['type']
    const fieldName = assertion['field_name']
    const fieldListString = assertion['fieldList']
    const relation = assertion['relation']
    const target = assertion['target']
    const strings = assertion['strings']

    // watch out for conditionals
    let condition = null
    if(assertion['excluded']) {
      const excluded_roles = oxford.breakRoleList(this.matcher, assertion['excluded'])
      condition = conditional.roleNotPresent(excluded_roles)
    }

    if(relation) {
      this.addRelationConstraint(role, fieldName, relation, target, condition)
    }

    if(strings) {
      // of the form MUST have a <type> field named <fieldName> whose value
      //  MUST be one of "a", "b", or "c"
      const fields = oxford.breakStringList(strings)
      this.addConstraint(role, constraint.fieldValue(fieldName, {enum: fields}), condition)
    }

    if(type) {
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
      this.addConstraint(role, constraint.DoesNotHaveField(fieldName), condition)
    }

    // there can be role defs there too
    if(assertion['child_type']) {
      this.matcher.addRole(assertion['child_role'])
      const childType = assertion['child_type']
      if (childType === 'value') {
        this.roles.addChildRole(role, fieldName, assertion['child_role'])
      } else if (childType === 'element' || childType === 'field') {
        this.roles.addGrandchildRole(role, fieldName, assertion['child_role'])
      }
    }
  } // assignConstraints

  addConstraint (role, constraint, condition) {
    if (condition) {
      constraint.addCondition(condition)
    }
    this.constraints.add(role, constraint)
  } // addConstraint
} // class Assigner

module.exports = (roleConstraints, roleFinder, matcher, allowedFields) =>
  new Assigner(roleConstraints, roleFinder, matcher, allowedFields)
