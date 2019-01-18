var Mime = function() { }

var self = new Mime()

self.lookup = function(filepath) {
  var extname = require('path').extname(filepath)
  switch (extname) {
    case '.html':
      return 'text/html'
    case '.s':
      return 'text/html'
    case '.js':
      return 'application/javascript'
    case '.css':
      return 'text/css'
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
      return 'image/jpg'
    case '.gif':
      return 'image/jpg'
    default:
      return 'text/plain'
  }
}

module.exports = self