class NodeValidator {
  constructor (parser) {
    this.parser = parser
  } // constructor

  validateNode (node, path, roles, problems) {
    // may have more roles based on field presence/value etc
    this.parser.findMoreRoles(node, roles)

    // constraints are attached per-role
    for (const role of roles) {
      for (const constraint of this.parser.getConstraints(role)) {
        if (constraint.applies(node, roles)) {
          constraint.check(node, path, problems)
        }
      }
    }

    // for each field
    for (const [name, value] of Object.entries(node)) {
      if (!this.parser.isFieldAllowed(roles, name)) {
        problems.push(`Field "${name}" not allowed in ${path}`)
      }

      // recurse into children if they have roles
      const childRoles = this.parser.findChildRoles(roles, name)
      if (childRoles.length) {
        this.validateNode(value, `${path}.${name}`, childRoles, problems)
      }

      // find inheritance-based roles for that field
      const grandchildRoles = this.parser.findGrandchildRoles(roles, name)
      const gcIndex = Array.isArray(value) ? i => `[${i}]` : i => i
      for (const [index, childValue] of Object.entries(value)) {
        this.validateNode(
          childValue,
          `${path}.${name}.${gcIndex(index)}`,
          [...grandchildRoles],
          problems
        )
      } // for ...
    } // for ...
  } // validateNode
} // class NodeValidator

module.exports = parser => new NodeValidator(parser)