const { compile } = require('nexe')
const inputAppName = '././index.js'
const outputAppName = 'NXPayload-Converter'

compile({
  input: inputAppName,
  output: outputAppName,
  build: true,
}).then((err) => {
  if (err) throw err
  console.log('success')
})
