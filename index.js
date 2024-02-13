const express = require('express');
const app = express();
const path = require("path");
const serveStatic = require("serve-static");
require("./createEnv");

var server = require("http").createServer(app);

app.use(
    "/",
    serveStatic(path.join(__dirname, "/dist"), {
        etag: false,
        lastModified: false,
    })
);
// Catch all routes and redirect to the index file
app.get("*", (req, res) => {
    res.set({ "Content-Type": "text/html" });
    res.sendFile(path.join(__dirname, "/dist/index.html"), {
        etag: false,
        lastModified: false,
    });
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
  console.log('Env: '+ JSON.stringify(process.env, null, 2));
  console.log('test env var: '+ process.env.TEST_ENV_VAR);
});