const express = require('express');
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const serveStatic = require("serve-static");

require("./createEnv");

const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    "http://travelmap2-414205.wl.r.appspot.com/",
    "https://travelmap2-414205.wl.r.appspot.com/"
];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, PATCH, DELETE',);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
});

app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var server = require("http").createServer(app);

app.use("/maps", require("./api/maps")(app));
app.use("/notion", require("./api/notion")(app));
app.use("/google", require("./api/google")(app));

if (process.env.NODE_ENV === "production") {
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
}

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
    console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY);
});