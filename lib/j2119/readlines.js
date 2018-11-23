const LineReader = require('n-readlines')

function * readlines (source) {
  const reader = new LineReader(source)
  let line
  while ((line = reader.next())) {
    yield line.toString('utf-8').trim()
  }
} // readlines

module.exports = readlines
