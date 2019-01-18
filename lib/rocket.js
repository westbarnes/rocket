const poster = require('./poster')
const parser = require('./post-parser')
const jwt = require('./jwt')
const path = require('path')
const cipher = require('./cipher')

const Rocket = function() {
  //stores routes
  this.routes = { 'get' : {}, 'post' : {}, 'put' : {}, 'delete' : {} }
  //stores parameter keys specified in url patterns / routes
  this.keys = { 'get' : {}, 'post' : {}, 'put' : {}, 'delete' : {} }
  //dyanmic bases for get requests (used for static routing)
  this.dynamic_bases = { }
  //relative static file directory
  this.static_root = path.join(__dirname, 'static')
  //default alias for the / path
  this.root_alias = '/index.html'
  //token required
  this.token_required = true
  //token secret
  this.token_secret = 'change_me_for_real_security'
  //app key option
  this.app_key_or_token = false
  //hack protection
  this.upload_limit = 1e6; //1MB
  //debug flag
  this.debug = false
  //verbose flag (for logging)
  this.verbose = false
  //unauthorized redirect
  this.login_redirect = null
  //link in poster
  this.poster= poster
}

const self = new Rocket()

self._add = function(method, url_pattern, callback) {
  var key = url_pattern.toLowerCase().replace(/:\w+/g,':')
  var param = /:\w+/.exec(url_pattern)
  if (param) {
    //saves the parameter key (e.g. :id => id)
    self.keys[method][key] = param[0].substring(1)
  }
  self.routes[method][key] = callback
  console.log('Adding route: ' + method.toUpperCase() + ' ' + url_pattern)
}

self.get = function(url_pattern, callback) {
  self._add('get', url_pattern, callback)
  var elements = url_pattern.split('/')
  self.dynamic_bases[elements[1]] = true
}

self.post = function(url_pattern, callback) {
  self._add('post', url_pattern, callback)
}

self.put = function(url_pattern, callback) {
  self._add('put', url_pattern, callback)
}

self.delete = function(url_pattern, callback) {
  self._add('delete', url_pattern, callback)
}

self.dispatch_static = function(relative_path, req, res) {
  var filepath = path.join(self.static_root, relative_path)
  require('fs').readFile(filepath, function(err, content) {
    if (err) {
      console.log(err)
      //TODO: handle this better
      return res.render('text', 'Invalid route: ' + req.url, 400)
    }
    res.writeHeader(200, { "Content-Type": require('./mime').lookup(filepath) })
    res.write(content, 'binary')
    res.end()
  })
}

self.unauthorized = function(req, res) {
  var method = req.method.toLowerCase()
  var accept = ''+req.headers['accept']
  if (self.login_redirect && method == 'get' && accept.indexOf('html') > 0) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end('<!DOCTYPE html><html><head><script>window.location.replace("' + self.login_redirect + '")</script></head><body></body></html>')
  }
  else {
    res.writeHead(403, {'Content-Type': 'text/plain'})
    res.end('Access denied')
  }
}

self.generate_token = function(payload) {
  return jwt.encode(payload, self.token_secret)
}

self.get_token = function(req) {
    //fastest
    var x_auth = req.headers['x-auth-token']
    if (x_auth) return x_auth
    
    //easiest
    var token = self.get_cookie(req, 'token')
    if (token) return token

    throw new Error('No token found')
}

self.get_cookie = function(req, name) {
  var rc = req.headers.cookie
  if (rc) {
    var cookies = rc.split(';')
    var cookie = null
    for(var i=0; i < cookies.length; i++) {
      cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
          return decodeURIComponent(cookie.substring(name.length+1))
        }
    }
  }
  return null
}

self.extract_token = function(req) {
  var token = self.get_token(req)
  var result = jwt.decode(token, self.token_secret)
  if (result.expires && new Date(result.expires) < new Date()) {
    throw new Error('Token expired')
  }
  return result
}

self.parse = function(req, callback) {
  var method = req.method.toLowerCase()
  var parsed_url = require('url').parse(req.url, true)
  var path = parsed_url.pathname
  
  if (method == 'get') {
    callback(method, path, parsed_url.query)
  }
  else {
    var body = '';
    req.on('data', function (data) {
        body += data
        // Too much POST data, kill the connection!
        if (body.length > self.upload_limit) req.connection.destroy()
    })
    req.on('end', function () {
      var contentType = req.headers['content-type']
      if (contentType == 'application/json') {
        callback(method, path, JSON.parse(body))
      }
      else {
        callback(method, path, parser.to_json(body))
      }
    })
  }
}

self.enrich = function(req, res) {
  res.notice = function(msg) {
    if (self.verbose || self.debug) console.log(msg)
    res.writeHead(302, { 
        'Set-Cookie' : 'notice={"text":"' + msg + '"}',
        'Location' : req.headers.referer,
      })
    res.end()
  }
  
  res.error = function(code, e) {
    res.writeHead(code, {'Content-Type': 'application/json'})
    res.end(e)
  }

  res.success = function() {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{ "msg": "success" }')
  }
  
  res.bad_request = function(e) {
    var msg = (typeof e == 'string') ? e : JSON.stringify(e, null, 3)
    if (self.verbose || self.debug) console.log(msg)
    res.error(400, msg)
  }
  
  res.render = function(type, o, code) {
    var num = code || 200
    switch(type) {
      case 'json':
        res.writeHead(num, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(o))
        break
      case 'text':
        res.writeHead(num, { 'Content-Type': 'text/plain' })
        res.end(o)
        break
      case 'html':
        res.writeHead(num, { 'Content-Type': 'text/html' })
        res.end(o)
        break
      default:
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Unsupported render type: ' + type)
    }
  }
  
  res.internal_error = function(e) {
    var msg = null
    try {
      //not efficient, but effective
      JSON.parse(e)
      msg = JSON.stringify(e, null, 3)
    }
    catch(ex) {
      msg = ''+e
    }
    console.log('ERROR   ' + msg)
    res.error(500, msg)
  }
}

self.dispatch = function(req, res) {
  self.enrich(req, res) //attach some convinence methods
  self.parse(req, function(method, path, params) {
    try {
      var routes = self.routes[method]
      
      try {
        if (self.app_key_or_token) {
          if (p.appid && p.secret) {
            p.app = {
              key: cipher.encrypt(p.appid, p.secret)
            }
          }
          else {
            params['jwt'] = self.extract_token(req)
          }
        }
        else if (self.token_required) {
          params['jwt'] = self.extract_token(req)
        }
      }
      catch(e) {
        if (self.verbose) console.log(e.message)
        return self.unauthorized(req, res)
      }
      
      if (method == 'get') {
        //check if we're loading the root page
        if (path.length == 1) {
          path = self.root_alias
        }
        //check if we're dealing with a static request
        var elements = path.split('/')
        if (!self.dynamic_bases[elements[1]]) {
          if (self.verbose) console.log('STATIC   ' + path)
          return self.dispatch_static(path, req, res)
        }
      }
      if (self.verbose) console.log(method.toUpperCase() + '   ' + path)
      if (self.debug) console.log(params)
      
      //exact match
      var callback = routes[path]
      if (callback) return callback(res, req, params)
       
      //variable as last path element
      var index = path.lastIndexOf('/')
      var path2 = path.substring(0, index) + '/:'
      callback = routes[path2]
      if (callback) {
        //enrich params and callback
        var keys = self.keys[method]
        var key = keys[path2]
        var value = path.substring(index + 1)
        params[key] = value
        //if (self.debug) console.log(key + ': ' + value)
        return callback(res, req, params)
      }
        
      //variable in second to last path element
      var next_index = path.lastIndexOf ('/', index - 1)
      if (next_index > 0) {
        var path3 = path.substring(0, next_index) + '/:' + path.substring(index)
        callback = routes[path3]
        if (callback) {
          //enrich params and callback
          var keys = self.keys[method]
          var key = keys[path3]
          var value = path.substring(next_index + 1, index)
          params[key] = value
          //if (self.debug) console.log(key + ': ' + value)
          return callback(res, req, params)
        }
      }
      
      res.render('text', 'Invalid route: ' + req.url, 400)
    }
    catch(e) {
      res.internal_error(e)
    }
  })
}

module.exports = self