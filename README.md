# Rocket

A minimalist, secure web server framework with no dependencies.

## Hello world

```
const app = require('rocket')
app.token_required = false
app.get('/hello', (res, req, params) => {
  res.render('text', 'hello world')
})
const server = require('http').createServer(app.dispatch)
const port = 3000
server.listen(port, function() {
    console.log("Server listening on: http://localhost:%s", port)
})
```

## Getting started with examples

Change into the examples directory and start by running:

```
node ./hello_world.js
```

Navigate your browser to to `http://localhost:3000/hello` to see the running example.

To run the secure example, start the authentication server and the secure server examples:

```
node ./simple_auth_server.js &
node ./simple_secure_server.js
```

Follow these steps to see the example in action:

1. Navigate to `http://localhost:3001/hello` to see that your access is denied.
2. Navigate to `http://localhost:3000/login?name=Bob` to authenticate.
3. Navigate to `http://localhost:3001/hello` to verify the authentication.