const fs = require('fs')
const crypto = require('crypto')

sessionkey = crypto.randomBytes(64).toString('hex').trim()
console.log(sessionkey)
