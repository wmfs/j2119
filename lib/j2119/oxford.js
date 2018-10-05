const XRegExp = require('xregexp')
const BASIC = '(?<CAPTURE>X((((,\\s+X)+,)?)?\\s+or\\s+X)?)'

function re (particle, options = { }) {
  let [ hasCapture, inter, hasConnector, last ] = BASIC.split('X')

  if (options.connector) {
    hasConnector = hasConnector.replace('or', options.connector)
  }

  particle = (options.use_article) ? `an?\\s+(${particle})` : `(${particle})`

  hasCapture = (options.capture_name)
    ? hasCapture.replace('CAPTURE', options.capture_name)
    : hasCapture.replace('?<CAPTURE>', '')

  return [ hasCapture, inter, hasConnector, last ].join(particle)
} // re

const stringBreaker = /^[^"]*"([^"]*)"/
function breakStringList (list) {
  const pieces = []

  for (let m = list.match(stringBreaker); m !== null; m = list.match(stringBreaker)) {
    const [ consumed, matched ] = m
    pieces.push(matched)
    list = list.substring(consumed.length)
  }

  return pieces
} // breakStringList

function breakRoleList (matcher, list) {
  const pieces = []

  const roleBreaker = XRegExp(`^an?\\s+(${matcher.roleMatcher})(,\\s+)?`)
  for (let m = list.match(roleBreaker); m !== null; m = list.match(roleBreaker)) {
    const [ consumed, matched ] = m
    pieces.push(matched)
    list = list.substring(consumed.length)
  }

  const altFinder = XRegExp(`^\\s*(and|or)\\s+an?\\s+(${matcher.roleMatcher})`)
  const altMatch = list.match(altFinder)
  if (altMatch) {
    pieces.push(altMatch[2])
  } // if ...

  return pieces
}

module.exports = {
  BASIC,
  re,
  breakStringList,
  breakRoleList
}
