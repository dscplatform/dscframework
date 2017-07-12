const http = require("http");
const express = require("express");
const cors = require("cors");
const DSCServer = require("../").Server;

// Express
const app = express();
app.use(cors());

// Server
var server = http.createServer(app);
var dsc = new DSCServer(server);
dsc.start();

// Start
server.listen(8080, () => {

});
