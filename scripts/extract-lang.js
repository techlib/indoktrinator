var fs = require('fs')
var _ = require('lodash')

var exec = require('child_process').exec

const binPath   = './node_modules/i18next-parser/bin/cli.js'
const outPath   = './scripts/tmp/'
const srcPath   = './indoktrinator/static/js/src/'
const destPath  = './indoktrinator/static/js/src/lang/'
const flags     = '-l en,cs --write-old false --ignore-variables --keep-removed -n common -r'
const run       = `${binPath} ${srcPath} -o ${outPath} ${flags}`


exec(run, function callback(error, stdout, stderr) {

  if (error !== null) {
    console.log('ERROR')
    console.log(stderr)
    process.exit(1)
  }

  _.each(['en', 'cs'], function(lng) {
      var folderPath = `${outPath}/${lng}`
      var lngFiles = fs.readdirSync(folderPath)

      var res = {}

      _.each(lngFiles, function(file) {

        var filePath = `${outPath}/${lng}/${file}`

        var data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        var key = file.replace('.json', '')
        res[key] = data
      })

      var existingFile = `${destPath}/${lng}.json`
      var existing = JSON.parse(fs.readFileSync(existingFile, 'utf8'))

      _.mergeWith(existing, res, function(obj, srcVal) {
        // this is to make sure that existing translations won't be replaced
        // with empty string from detected file
        if (srcVal === '') {
          return obj
        }
      })

      var result = JSON.stringify(existing, null, 2)
      fs.writeFileSync(existingFile, result)
  })

})

