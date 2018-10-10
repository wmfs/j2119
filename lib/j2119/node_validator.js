class NodeValidator {
  constructor (parser) {
    this.parser = parser
  } // constructor

  validateDocument (doc) {
    const problems = []
    this.validateNode(doc, this.parser.root, [this.parser.root], problems)
    return problems
  } // validateDocument

  validateNode (node, path, roles, problems) {
    if ((node === null) || (typeof node !== 'object') || Array.isArray(node)) return

    // may have more roles based on field presence/value etc
    this.parser.findMoreRoles(node, roles)

    this.checkConstraints(node, path, roles, problems)

    // for each field
    for (const [name, value] of Object.entries(node)) {
      this.validateField(name, path, roles, problems)

      this.validateChild(value, name, path, roles, problems)

      this.validateGrandchildren(value, name, path, roles, problems)
    } // for ...
  } // validateNode

  checkConstraints (node, path, roles, problems) {
    // constraints are attached per-role
    for (const role of roles) {
      const allConstraints = this.parser.getConstraints(role)
      for (const constraint of allConstraints) {
        if (constraint.applies(node, roles)) {
          constraint.check(node, path, problems)
        }
      }
    }
  } // checkConstraints

  validateField (name, path, roles, problems) {
    if (!this.parser.isFieldAllowed(roles, name)) {
      problems.push(`Field "${name}" not allowed in ${path}`)
    }
  } // validateField

  validateChild (childNode, name, path, roles, problems) {
    const childRoles = this.parser.findChildRoles(roles, name)
    if (!childRoles.length) return

    // recurse into children if they have roles
    this.validateNode(
      childNode,
      `${path}.${name}`,
      childRoles,
      problems
    )
  } // validateChild

  validateGrandchildren (childNode, name, path, roles, problems) {
    if (typeof childNode === 'object') {
      // find inheritance-based roles for that field
      const grandchildRoles = this.parser.findGrandchildRoles(roles, name)
      const gcIndex = Array.isArray(childNode) ? i => `[${i}]` : i => `.${i}`
      for (const [index, gcValue] of Object.entries(childNode)) {
        this.validateNode(
          gcValue,
          `${path}.${name}${gcIndex(index)}`,
          [...grandchildRoles],
          problems
        )
      } // for ...
    }
  } // validateGrandchildren
} // class NodeValidator

module.exports = parser => new NodeValidator(parser)
