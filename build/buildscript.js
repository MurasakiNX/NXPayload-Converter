const { compile } = require('nexe')
const inputAppName = './index.js'
const outputAppName = 'NXPayload-Converter'

compile({
  input: inputAppName,
  output: outputAppName,
  build: true,
  ico: './icon.ico'
}).then((err) => {
  if (err) throw err
  console.log('success')
})
