function deduce (value) {
  const sm = value.match(/^"(.*)"$/)
  if (sm) return sm[1]
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (value.match(/^\d+$/)) return parseInt(value)
  return parseFloat(value)
} // deduce

module.exports = deduce
