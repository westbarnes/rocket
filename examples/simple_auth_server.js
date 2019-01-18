const app = require('..')

app.get('/login', (res, req, params) => {
  if (!params.name) res.bad_request('Missing parameter: name')
  //create a token that expires in 60 minutes
  const nowplus60 = new Date(new Date().getTime() + 60*60000)
  const token = app.generate_token({ name: params.name, expires: nowplus60 })
  //write the token as a cookie
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Set-Cookie' : ['token=' + token] })
  res.end('success')
})

app.get('/logout', (res, req, params) => {
  //clear the token to cause a logout
  res.writeHead(200, { 'Set-Cookie' : ['token={}'] })
  res.end('success')
})

app.token_required = false

const server = require('http').createServer(app.dispatch)
const port = 3000
server.listen(port, function() {
    console.log("Server listening on: http://localhost:%s", port)
})