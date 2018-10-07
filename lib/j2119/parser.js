const roleConstraints = require('./role_constraints')
const roleFinder = require('./role_finder')
const allowedFields = require('./allowed_fields')
const oxford = require('./oxford')
const matcher = require('./line_matcher')
const assigner = require('./assigner')
const XRegExp = require('xregexp')
const readlines = require('./readlines')

const ROOT = /This\s+document\s+specifies\s+a\s+JSON\s+object\s+called\s+an?\s+"([^"]+)"\./

class Parser {
  constructor (source) {
    this.haveRoot = false
    this.failed = false
    this.constraints = roleConstraints()
    this.finder = roleFinder()
    this.allowedFields = allowedFields()

    for (const line of readlines(source)) {
      const rootMatch = line.match(ROOT)
      if (rootMatch) {
        if (this.haveRoot) {
          this.fail('Only one root declaration permitted')
        } else {
          this.root = rootMatch[1]
          this.matcher = matcher(this.root)
          this.assigner = assigner(
            this.constraints,
            this.finder,
            this.matcher,
            this.allowedFields
          )
          this.haveRoot = true
        }
      } else {
        if (!this.haveRoot) {
          this.fail('Root declaration must be first line')
        } else {
          this.procLine(line)
        }
      }
    }

    if (this.failed) {
      throw new Error('Could not create parser')
    }
  } // constructor

  procLine (line) {
    if (this.matcher.isConstraintLine(line)) {
      this.assigner.assignConstraints(this.matcher.buildConstraint(line))
    } else if (this.matcher.isOnlyOneMatchLine(line)) {
      this.assigner.assignOnlyOneOf(this.matcher.buildOnlyOne(line))
    } else if (/^Each of a/.test(line)) {
      const eachesLine = XRegExp.exec(line, this.matcher.eachOfMatch)
      const eaches = oxford.breakRoleList(this.matcher, eachesLine['each_of'])
      eaches.forEach(each => this.procLine(`A ${each} ${eachesLine['trailer']}`))
    } else if (this.matcher.isRoleDefLine(line)) {
      this.assigner.assignRoles(this.matcher.buildRoleDef(line))
    } else {
      this.fail(`Unrecognized line: ${line}`)
    }
  } // procLine

  fail (message) {
    this.failed = true
    console.error(message)
  } // fail

  findMoreRoles (node, roles) {
    return this.finder.findMoreRoles(node, roles)
  }

  findGrandchildRoles (roles, name) {
    return this.finder.findGrandchildRoles(roles, name)
  }

  findChildRoles (roles, name) {
    return this.finder.findChildRoles(roles, name)
  }

  getConstraints (role) {
    return this.constraints.getConstraints(role)
  }

  isFieldAllowed (roles, child) {
    return this.allowedFields.isAllowed(roles, child)
  }
} // class Parser

module.exports = source => new Parser(source)
module.exports.ROOT = ROOT
