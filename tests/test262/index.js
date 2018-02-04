#! /usr/bin/env node

"use strict";

var path = require("path");
var Readable = require("stream").Readable;

var Interpreter = require("../../../../results-interpreter");

var report = require("./report");
var expectationsFile = path.join(__dirname, "expectations.txt");
var shouldUpdate = process.argv.indexOf("--update-expectations") > -1;

var child_process = require("child_process");
var os = require("os");
var cpuCount = os.cpus().length;
var workers = [], index;
var testCount = 0;

for (index = 0; index < cpuCount; index += 1) {
  workers.push(child_process.fork(path.join(__dirname, "worker.js")));
}

workers.forEach(function(worker, index) {
  worker.on("message", (result) => {
    if (result === "finish") {
      worker.disconnect();

      index -= 1;
      if (index === 0) {
        results.push(null);
      }

      return;
    }
    testCount += 1;
    if (testCount % 1000 === 0) {
      console.log(testCount);
    }
    results.push(result);
  });

  worker.send({ workerCount: cpuCount, workerId: index });
});

var results = new Readable({
  objectMode: true,
  read: function() {
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

results
  .pipe(interpreter)
  .on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .on("finish", function () {
    report(this.summary);
    process.exitCode = this.summary.passed ? 0 : 1;
  });
