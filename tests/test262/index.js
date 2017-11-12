"use strict";

var path = require("path");

var testDir = path.join(__dirname, "test262");
var whitelistFile = path.join(__dirname, "expectations.txt");
var shouldUpdate = process.argv.indexOf("--update-whitelist") > -1;

var TestStream = require("test262-stream");
var Interpreter = require("test-interpreter");
var run = require('./run');

var stream = new TestStream(testDir);
var { Transform } = require("stream");
var results = new Transform({
  objectMode: true,
  transform(test, encoding, done) {
    var result = {
      id: test.file.replace(/^test\//, "") + "(" + test.scenario + ")",
      expected: test.attrs.negative && test.attrs.negative.phase === "early" ?
        "fail" : "pass",
      actual: run(test)
    };

    done(null, result);
  }
});
var interpreter = new Interpreter(whitelistFile, {
  outputFile: shouldUpdate ? whitelistFile : null
});

console.log(`Now running tests...`);
stream.pipe(results)
  .pipe(interpreter)
  .on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .on("finish", function() {
    report(this.summary);
    process.exitCode = this.summary.passed ? 0 : 1;
  });

function report(summary) {
  var goodnews = [
    summary.allowed.success.length + " valid programs parsed without error",
    summary.allowed.failure.length +
      " invalid programs produced a parsing error",
    summary.allowed.falsePositive.length +
      " invalid programs did not produce a parsing error" +
      " (and allowed by the whitelist file)",
    summary.allowed.falseNegative.length +
      " valid programs produced a parsing error" +
      " (and allowed by the whitelist file)",
  ];
  var badnews = [];
  var badnewsDetails = [];

  void [
    {
      tests: summary.disallowed.success,
      label:
        "valid programs parsed without error" +
        " (in violation of the whitelist file)",
    },
    {
      tests: summary.disallowed.failure,
      label:
        "invalid programs produced a parsing error" +
        " (in violation of the whitelist file)",
    },
    {
      tests: summary.disallowed.falsePositive,
      label:
        "invalid programs did not produce a parsing error" +
        " (without a corresponding entry in the whitelist file)",
    },
    {
      tests: summary.disallowed.falseNegative,
      label:
        "valid programs produced a parsing error" +
        " (without a corresponding entry in the whitelist file)",
    },
    {
      tests: summary.unrecognized,
      label: "non-existent programs specified in the whitelist file",
    },
  ].forEach(function({ tests, label }) {
    if (!tests.length) {
      return;
    }

    var desc = tests.length + " " + label;

    badnews.push(desc);
    badnewsDetails.push(desc + ":");
    badnewsDetails.push(
      ...tests.map(function(test) {
        return test.id || test;
      })
    );
  });

  console.log("Testing complete.");
  console.log("Summary:");
  console.log(goodnews.join("\n").replace(/^/gm, " ✔ "));

  if (!summary.passed) {
    console.log("");
    console.log(badnews.join("\n").replace(/^/gm, " ✘ "));
    console.log("");
    console.log("Details:");
    console.log(badnewsDetails.join("\n").replace(/^/gm, "   "));
  }
}
