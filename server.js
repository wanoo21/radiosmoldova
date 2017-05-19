const connect = require('connect')
const serveStatic = require('serve-static')
const fs = require('fs')
const path = require('path')
const app = connect()

// Use static folders
app.use(serveStatic(path.join(__dirname, 'server')))

// Redirect all requests to index.html
app.use((req, res) => {
    res.writeHead(200, {'Content-type': 'text/html'})
    res.end(fs.readFileSync(path.join(__dirname, 'server/index.html')))
})

// Start server
app.listen(8000, function() {
    console.log('Server running on port %s.', 8000);
});