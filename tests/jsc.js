"use strict";

var fs = require("fs");
var spawn = require("child_process").spawn;

var bundleTests = require("./helpers/bundler");
var buildJSHint = require("../scripts/build");

console.log("Building JSHint...");

buildJSHint("web", function(err, version, jshintSrc) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log("Building tests...");

  bundleTests(function(err, testSrc) {
    var stdout = "";
    var src, child;

    if (err) {
      console.error(err);
      process.exit(1);
    }

    src = [
      "window = this;",
      "console = { log: print };",

      // This is an invalid shim; a more robust version is necessary.
      "setTimeout = function(cb) { cb(); };",

      jshintSrc,
      testSrc
    ].join("\n;\n");

    fs.writeFileSync("thingthing.js", src);

    console.log("Running tests...");

    child = spawn("jsc", ["thingthing.js"], {
      stdio: [process.stdin, "pipe", process.stderr]
    });
    child.stdout.on("data", function(chunk) {
      stdout += chunk;
      process.stdout.write(chunk);
    });

    child.on("exit", function(code) {
      if (stdout.indexOf("JavaScriptCore failure") > -1) {
        process.exit(1);
      }
    });
  });
});
