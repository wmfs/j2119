// Tried use jsonpath to do this, but it couldn't distinguish between
// paths and reference paths.  It's also unhappy with '$.café_au_lait'
// but ok with $['café_au_lait'], which is weird.

const XRegExp = require('xregexp') // because we want the unicode categories

const INITIAL_NAME_CLASSES = [ 'Lu', 'Ll', 'Lt', 'Lm', 'Lo', 'Nl' ]
const NON_INITIAL_NAME_CLASSES = [ 'Mn', 'Mc', 'Nd', 'Pc' ]
const FOLLOWING_NAME_CLASSES = [...INITIAL_NAME_CLASSES, ...NON_INITIAL_NAME_CLASSES]
const DOT_SEPARATOR = '\\.\\.?'

function classesToRe (classes) {
  const reClasses = classes.map(r => `\\p{${r}}`)
  return `[${reClasses.join('')}]`
}

const nameRe = classesToRe(INITIAL_NAME_CLASSES) + classesToRe(FOLLOWING_NAME_CLASSES) + '*'

const dotStep = DOT_SEPARATOR + '((' + nameRe + ')|(\\*))'
const bracketStep = '\\[' + "'" + nameRe + "'" + '\\]'
const numIndex = '\\[\\d+(, *\\d+)?\\]'
const starIndex = '\\[\\*\\]'
const colonIndex = '\\[(-?\\d+)?:(-?\\d+)?\\]'
const index = '((' + numIndex + ')|(' + starIndex + ')|(' + colonIndex + '))'
const step = '((' + dotStep + ')|(' + bracketStep + ')|(' + index + '))' + '(' + index + ')?'
const path = '^\\$' + '(' + step + ')*$'

const rpDotStep = DOT_SEPARATOR + nameRe
const rpNumIndex = '\\[\\d+\\]'
const rpStep = '((' + rpDotStep + ')|(' + bracketStep + '))' + '(' + rpNumIndex + ')?'
const referencePath = '^\\$' + '(' + rpStep + ')*$'

const pathRe = new XRegExp(path)
const referencePathRe = new XRegExp(referencePath)

function isPath (path) {
  return pathRe.test(path)
} // isPath

function isReferencePath (path) {
  return referencePathRe.test(path)
}

module.exports = {
  isPath: isPath,
  isReferencePath: isReferencePath
}
