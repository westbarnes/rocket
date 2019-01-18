const parser = require('./post-parser')
const url = require('url')
const http = require('http')
const https = require('https')

const Poster = function() { 
  this.unsecure = false
}

const self = new Poster()

self.get = function(uri, config, callback) {
  self.request(uri, config, callback)
}

self.get = function(uri, callback) {
  self.request(uri, {}, callback)
}

self.post = function(uri, config, callback) {
  self.request(uri, config, callback)
}

self.request = function(uri, config, callback) {
  if (self.unsecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  
  var parsed_uri = url.parse(uri)
  var options = {
      host: parsed_uri.hostname,
      port: parsed_uri.port,
      path: parsed_uri.path,
      method: config.data ? 'POST' : 'GET',
      headers: config.headers || {},
  }
  
  var post_data = null
  if (config.data) {
    if (options.headers['Content-Type'] == 'application/json') {
      post_data = JSON.stringify(config.data)
    }
    else {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      post_data = parser.to_query(config.data)
    }
    options.headers['Content-Length'] = Buffer.byteLength(post_data)
  }
  
  if (config.token) {
    options.headers['X-Auth-Token'] = config.token
  }

  var doer = (parsed_uri.protocol == 'https:') ? https : http
  var req_res = ''
  var req = doer.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        req_res += chunk
      })
      res.on('end', function() {
        if (res.statusCode < 200 || res.statusCode > 299) {
          callback(req_res, null)
        }
        else {
          callback(null, req_res)
        }
      })
  })
  
  req.on('error', function(e) {
    callback(e, null)
  })
  req.on('timeout', function () {
    req.abort();
    callback({msg: 'timeout'}, null)
  })
  if (post_data) {
    req.write(post_data)
  }
  req.end()
}

module.exports = self