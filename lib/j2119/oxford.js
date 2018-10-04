const stringBreaker = /^[^\"]*\"([^\"]*)\"/
function breakStringList (list) {
  const pieces = []

  for (let m = list.match(stringBreaker); m !== null; m = list.match(stringBreaker)) {
    const [ consumed, matched ] = m
    pieces.push(matched)
    list = list.substring(consumed.length)
  }

  return pieces
} // breakStringList

module.exports = {
  re: (particle, options) => { },
  breakStringList,
  breakRoleList: (matcher, list) => { }
}
