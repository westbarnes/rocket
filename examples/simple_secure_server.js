const app = require('..')

app.get('/hello', (res, req, params) => {
  res.render('text', 'hello: ' +  params.jwt.name)
})

const server = require('http').createServer(app.dispatch)
const port = 3001
server.listen(port, function() {
    console.log("Server listening on: http://localhost:%s", port)
})