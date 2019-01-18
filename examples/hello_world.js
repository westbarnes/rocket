const app = require('..')

app.token_required = false
app.get('/hello', (res, req, params) => {
  res.render('text', 'hello world')
})

const server = require('http').createServer(app.dispatch)
const port = 3000
server.listen(port, function() {
    console.log("Server listening on: http://localhost:%s", port)
})