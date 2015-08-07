"use strict";
var fs = require("fs");
var http = require("http");
var Stream = require("stream");
var path = require("path");
var url = require("url");

var browserify = require("browserify");
var buildJSHint = require(__dirname + "/../../../scripts/build");

var contentTypes = {
  ".html": "text/html",
  ".js": "application/javascript"
};

var build = {
  "index.html": function(done) {
    fs.readFile(__dirname + "/index.html", done);
  },

  "jshint.js": function(done) {
    buildJSHint("web", function(err, version, src) {
      done(err, src);
    });
  },

  "tests.js": require("../bundler")
};

module.exports = function(port, done) {
  var server = http.createServer(function(req, res) {
    var pathname = url.parse(req.url).pathname.slice(1) || "index.html";
    var contentType = contentTypes[path.extname(pathname)];

    if (!Object.hasOwnProperty.call(build, pathname)) {
      res.statusCode = 404;
      res.end("not found");
    }

    build[pathname](function(err, src) {
      if (err) {
        res.statusCode = 500;
        res.end(err.message);
        return;
      }

      res.setHeader("content-type", contentType);
      res.setHeader(
        "Cache-Control", "private, no-cache, no-store, must-revalidate"
      );
      res.setHeader("Expires", "-1");
      res.setHeader("Pragma", "no-cache");

      res.end(src);
    });
  });

  server.listen(port, function() {
    done(server);
  });
};


if (require.main === module) {
  console.log("Starting JSHint browser build testing server.");
  console.log(
    "(override default port via the NODE_PORT environmental variable)"
  );

  module.exports(process.env.NODE_PORT || 8045, function(server) {
    console.log("Server now listening on port " + server.address().port);
  });
}
