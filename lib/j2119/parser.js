const roleConstraints = require('./role_constraints')
const roleFinder = require('./role_finder')
const allowedFields = require('./allowed_fields')
const oxford = require('./oxford')
const matcher = require('./line_matcher')
const assigner = require('./assigner')
const XRegExp = require('xregexp')
const readlines = require('./readlines')

const ROOT = /This\s+document\s+specifies\s+a\s+JSON\s+object\s+called\s+an?\s+"([^"]+)"\./
const EXTENSION_ROOT = /This\s+document\s+specifies\s+an\s+extension\s+to\s+a\s+JSON\s+object\s+called\s+an?\s+"([^"]+)"\./

class Parser {
  constructor (source) {
    this.constraints = roleConstraints()
    this.finder = roleFinder()
    this.allowedFields = allowedFields()
    this.errors = []

    this.load(readlines(source))

    if (this.errors.length) {
      throw new Error(`Could not create parser: \n  ${this.errors.join('\n  ')}`)
    }
  } // constructor

  extend (extensionSource) {
    const reader = readlines(extensionSource)
    const firstLine = reader.next().value
    const extensionMatch = firstLine.match(EXTENSION_ROOT)
    if (extensionMatch) {
      this.procExtension(firstLine, extensionMatch[1])
    } else {
      this.error('Extension declaration must be first line')
    }

    this.load(reader, true)

    if (this.errors.length) {
      throw new Error(`Could not extend parser: \n  ${this.errors.join('\n  ')}`)
    }
  } // extend

  get haveRoot () { return this.root !== undefined }

  load (lineReader, isExtension = false) {
    for (const line of lineReader) {
      const rootMatch = line.match(ROOT)
      if (rootMatch) {
        this.procRoot(line, rootMatch[1])
      } else if (isExtension && line.match(EXTENSION_ROOT)) {
        this.error('Only one extension declaration permitted per file')
      } else {
        this.procLine(line)
      }
    } // for ...
  }

  procRoot (line, root) {
    if (this.haveRoot) {
      this.error('Only one root declaration permitted')
      return
    }

    this.root = root
    this.matcher = matcher(this.root)
    this.assigner = assigner(
      this.constraints,
      this.finder,
      this.matcher,
      this.allowedFields
    )
  } // procRoot

  procExtension (line, extension) {
    if (extension !== this.root) {
      this.error(`Extension does not extend "${this.root}"`)
    }
  } // procExtension

  procLine (line) {
    if (!this.haveRoot) {
      this.error('Root declaration must be first line')
      return
    }

    try {
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
        this.error(`Unrecognized line: ${line}`)
      }
    } catch (err) {
      this.error(`Unprocessable line: ${line}`)
    }
  } // procLine

  error (message) {
    this.errors.push(message)
  } // error

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

  toString () {
    return `${this.finder}\n${this.constraints}\n${this.allowedFields}`
  }
} // class Parser

module.exports = source => new Parser(source)
module.exports.ROOT = ROOT
module.exports.EXTENSION_ROOT = EXTENSION_ROOT
