var Jwt = function() { }

var self = new Jwt()

self.encode = function(payload, key) {
  if (!payload || !key) throw new Error('Must supply a payload and a key')
  var header = base64Encode("{ typ: 'JWT', alg: '*****' }") //HS512 (no hints for hackers)
  var body = base64Encode(JSON.stringify(payload))
  var signer = sign(header, body, key)
  return [ header, body, signer ].join('.')
}

self.decode = function(token, key) {
  if (!token || !key) throw new Error('Must supply a token and a key')
  var segments = token.split('.')
  if (segments.length != 3) throw new Error('Invalid token format')
  var body = segments[1]
  if (segments[2] !== sign(segments[0], body, key)) throw new Error('Invalid token signiture')
  return JSON.parse(base64Decode(body))
}

function sign(header, body, key) {
  //hs512 specific...
  return require('crypto').createHmac('sha512', key).update(header + '.' + body).digest('base64')
}

function base64Decode(str) {
  return new Buffer(str, 'base64').toString();
}

function base64Encode(str) {
  return new Buffer(str).toString('base64');
}

module.exports = self