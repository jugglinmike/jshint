'use strict';

var path = require("path");
var Transform = require("stream").Transform;

var Test262Stream = require("../../../../test262-stream");

var runTest = require("./test");

var stream = new Test262Stream(path.join(__dirname, "test262"), {
  omitRuntime: true
});

function normalizePath(str) {
  return path.posix.format(path.parse(str));
}

function hash(name) {
  var value = 0;
  var index = 0;
  for (index = 0; index < name.length; index += 1) {
    value += name.charCodeAt(index);
  }

  return value;
}

process.on('message', function(info) {
  var workerCount = info.workerCount;
  var workerId = info.workerId;

  var results = new Transform({
    objectMode: true,
    transform(test, encoding, done) {
      var id = normalizePath(test.file) + "(" + test.scenario + ")";
      if (hash(id) % workerCount !== workerId) {
        done(null);
        return;
      }

      done(null, {
        id: id,
        expected: test.attrs.negative && test.attrs.negative.phase === "early"
          ? "fail" : "pass",
        actual: runTest(test) ? "pass": "fail"
      });
    }
  });

  stream.pipe(results)
    .on("data", function(result) {
      if (result) {
        process.send(result);
      }
    })
    .on("finish", function() {
      process.send("finish");
    });
});
