var PostConverter = function() {}

var self = new PostConverter()

self.to_query = function(json) {
  var args = []
  var value = null
  for (var key in json) {
    if (!json.hasOwnProperty(key)) continue
    value = json[key]
    if (value instanceof Function) continue
    if (value instanceof Array) {
      for(var i=0; i < value.length; i++) {
        args.push(encodeURIComponent(key) + '[' + i + ']=' + encodeURIComponent(value[i]))
      }
    }
    else {
      args.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
    }
  }
  return args.join('&')
}

self.to_json = function(query) {
  var args = query.replace(/\+/g, '%20').split('&')
  var pair = null
  var key = null
  var value = null
  var last_char = null
  var first_bracket = null
  var json = {}
  for(var i = 0; i < args.length; i++) {
    pair = args[i].split('=')
    key = decodeURIComponent(pair[0])
    value = decodeURIComponent(pair[1])
    
    if (key.indexOf(']') > 0) {
      first_bracket = key.indexOf('[')
      if (first_bracket < 0) throw new Error('Malformed query. End bracket found with no starting bracket.')
      key = key.substring(0, first_bracket)
      if (!json[key]) json[key] = []
      json[key].push(value)
    }
    else {
      json[key] = value
    }
  }
  return json
}

module.exports = self