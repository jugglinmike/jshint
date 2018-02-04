#! /usr/bin/env node

"use strict";

var path = require("path");
var Transform = require("stream").Transform;

var Test262Stream = require("../../../../test262-stream");
var Interpreter = require("../../../../results-interpreter");

var report = require("./report");
var expectationsFile = path.join(__dirname, "expectations.txt");
var shouldUpdate = process.argv.indexOf("--update-expectations") > -1;
var stream = new Test262Stream(path.join(__dirname, "test262"), {
  omitRuntime: true
});

var child_process = require("child_process");
var os = require("os");
var workers = [];
var cpuCount = os.cpus().length;
var worker, index;

for (index = 0; index < cpuCount; index += 1) {
  worker = child_process.fork(path.join(__dirname, "worker.js"));
  worker.on("message", (result) => {
    dones[result.id](null, result);
    delete dones[result.id];
  });
  workers.push(worker);
}

function normalizePath(str) {
  return path.posix.format(path.parse(str));
}

var dones = Object.create(null);
var testCount = 0;
var results = new Transform({
  objectMode: true,
  transform(test, encoding, done) {
    test.id = normalizePath(test.file) + "(" + test.scenario + ")",
    testCount += 1;
    if (testCount % 1000 === 0) {
      console.log(testCount);
    }

    dones[test.id] = done;

    workers[testCount % cpuCount].send(test, function(err) {
      if (err) {
        done(err);
      }
    });
  }
});
var interpreter = new Interpreter(expectationsFile, {
  outputFile: shouldUpdate ? expectationsFile : null
});

console.log("Now running tests...");

if (shouldUpdate) {
  console.log(
    "The expectations file will be updated according to the results of this " +
    "test run."
  );
} else {
  console.log(
    "Note: the expectations file may be automatically updated by specifying " +
    "the `--update-expectations` flag."
  );
}

stream.pipe(results)
  .pipe(interpreter)
  .on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .on("finish", function () {
    workers.forEach(function(worker) {
      worker.disconnect();
    });
    report(this.summary);
    process.exitCode = this.summary.passed ? 0 : 1;
  });
