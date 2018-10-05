const XRegExp = require('xregexp')
const oxford = require('./oxford')

const MUST = '(?<modal>MUST|MAY|MUST NOT)'
const TYPES = require('./constraints').TYPES

const RELATIONS = [
  '', 'equal to', 'greater than', 'less than',
  'greater than or equal to', 'less than or equal to'
].join('|')
const RELATION = `((?<relation>${RELATIONS})\\s+)`

const S = '"[^"]*"' // string
const V = '\\S+' // non-string value: number, true, false, null
const RELATIONAL = `${RELATION}(?<target>${S}|${V})`

const CHILD_ROLE = ';\\s+((its\\s+(?<child_type>value))|' +
  'each\\s+(?<child_type_each>field|element))' +
  '\\s+is\\s+an?\\s+' +
  '"(?<child_role>[^"]+)"'

function definePredicate () {
  const strings = oxford.re(S, { capture_name: 'strings' })
  const enums = `one\\s+of\\s${strings}`
  return `(${RELATIONAL}|${enums})`
}
const predicate = definePredicate()

class LineMatcher {
  constructor (root) {
    this.roles = []
    this.addRole(root)
  } // constructor

  addRole (role) {
    this.roles.push(role)
    this.roleMatcher = this.roles.join('|')
    this.reconstruct()
  } // addRole

  buildRoleDef (line) {
    return this.build(this.roledefMatch, line)
  } // buildRoleDef

  buildConstraint (line) {
    const constraint = this.build(this.constraintMatch, line)
    // original Ruby code uses duplicate capture group name, which XRegExp disallows
    // so patch result across if present
    if (constraint['child_type_each']) constraint['child_type'] = constraint['child_type_each']
    return constraint
  } // buildConstraint

  buildOnlyOne (line) {
    return this.build(this.onlyOneMatch, line)
  } // buildOnlyOne

  isRoleDefLine (line) {
    return line.match(this.roledefLine)
  } // isRoleDefLine

  isConstraintLine (line) {
    return line.match(this.constraintStart)
  } // isConstraintLine

  isOnlyOneMatchLine (line) {
    return line.match(this.onlyOneStart)
  } // isOnlyOneMatchLine

  /// ///////////////
  build (re, line) {
    const match = XRegExp.exec(line, re)
    const matchNames = [...Object.keys(match)].slice(match.length).filter(n => !['index', 'input'].includes(n))
    const data = { }
    matchNames.forEach(name => {
      data[name] = (match[name] !== undefined) ? match[name] : null
    })
    return data
  } // build

  /// ///////////////
  reconstruct () {
    this.makeTypeRegex()

    // conditional clause
    const excludedRoles = 'not\\s+' +
      oxford.re(this.roleMatcher, {
        capture_name: 'excluded',
        use_article: true
      }) +
      '\\s+'
    const conditional = `which\\s+is\\s+${excludedRoles}`

    // regex for matching constraint lines
    const cStart = `^An?\\s+(?<role>${this.roleMatcher})\\s+(${conditional})?${MUST}\\s+have\\s+an?\\s+`
    const fieldList = 'one\\s+of\\s+' +
      oxford.re('"[^"]+"', {
        capture_name: 'field_list'
      })
    const cMatch = cStart +
      `((?<type>${this.typeRegex})\\s+)?` +
      'field\\s+named\\s+' +
      `(("(?<field_name>[^"]+)")|(${fieldList}))` +
      `(\\s+whose\\s+value\\s+MUST\\s+be\\s+${predicate})?` +
      `(${CHILD_ROLE})?` +
      '\\.'

    // regexp for matching lines of the form
    //  "An X MUST have only one of "Y", "Z", and "W".
    //  There's a pattern here, building a separate regex rather than
    //  adding more complexity to @constraint_matcher.  Any further
    //  additions should be done this way, and
    const ooStart = '^An?\\s+' +
      `(?<role>${this.roleMatcher})\\s+` +
      `${MUST}\\s+have\\s+only\\s+`
    const ooFieldList = 'one\\s+of\\s+' +
      oxford.re('"[^"]+"', {
        capture_name: 'field_list',
        connector: 'and'
      })
    const ooMatch = `${ooStart}${ooFieldList}`

    // regex for matching role-def lines
    const valMatch = 'whose\\s+"(?<fieldtomatch>[^"]+)"' +
      '\\s+field\'s\\s+value\\s+is\\s+' +
      '(?<valtomatch>("[^"]*")|([^"\\s]\\S+))\\s+'
    const withAMatch = 'with\\s+an?\\s+"(?<with_a_field>[^"]+)"\\s+field\\s'

    const rdMatch = '^An?\\s+' +
      `(?<role>${this.roleMatcher})\\s+` +
      `((?<val_match_present>${valMatch})|(${withAMatch}))?` +
      'is\\s+an?\\s+' +
      '"(?<newrole>[^"]*)"\\.\\s*$'

    this.roledefLine = XRegExp('is\\s+an?\\s+"[^"]*"\\.\\s*$')
    this.roledefMatch = XRegExp(rdMatch)

    this.constraintStart = XRegExp(cStart)
    this.constraintMatch = XRegExp(cMatch)

    this.onlyOneStart = XRegExp(ooStart)
    this.onlyOneMatch = XRegExp(ooMatch)

    const eoMatch = '^Each\\s+of\\s' +
      oxford.re(this.roleMatcher, {
        capture_name: 'each_of',
        use_article: true,
        connector: 'and'
      }) +
      '\\s+(?<trailer>.*)$'

    this.eachOfMatch = XRegExp(eoMatch)
  } // reconstruct

  makeTypeRegex () {
    // add modified numeric types
    const types = [...TYPES]
    const numberTypes = ['float', 'integer', 'numeric']
    const numberModifiers = ['positive', 'negative', 'nonnegative']
    numberTypes.forEach(numberType =>
      numberModifiers.forEach(numberModifier =>
        types.push(`${numberModifier}-${numberType}`)
      )
    )

    // add array types
    const arrayTypes = types.map(t => `${t}-array`)
    const nonemptyArrayTypes = arrayTypes.map(t => `nonempty-${t}`)
    types.push(...arrayTypes)
    types.push(...nonemptyArrayTypes)

    const nullableTypes = types.map(t => `nullable-${t}`)
    types.push(...nullableTypes)
    this.typeRegex = types.join('|')
  } // makeTypeRegex
} // Matcher

module.exports = root => new LineMatcher(root)
