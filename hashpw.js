const fs = require('fs')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

var pw = fs.readFileSync(0).toString().trim()
if (pw.length == 0)
    process.exit(0)

console.log(bcrypt.hashSync(pw, 10))

