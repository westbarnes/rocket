var crypto = require('crypto')

const CIPHER_ALGORITHM = 'aes-256-ctr'

var Cipher = function() { }

var self = new Cipher()

self.encrypt = function(source, secret) {
  return crypto.createCipher(CIPHER_ALGORITHM, secret).update(source).digest('base64')
}

self.encrypt = function(source, secret) {
  return crypto.createDecipher(CIPHER_ALGORITHM, secret).update(source).digest('utf8')
}

module.exports = self