#! /usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
var async = require("async");

var parseExpectations = require("./parse-expectations");
var report = require("./report");
var test = require("./test");

var paths = {
  test262: __dirname + "/test262/test",
  expectations: __dirname + "/expectations.txt"
};
var testName = /^(?!.*_FIXTURE).*\.[jJ][sS]/;

function findTests(directoryName, cb) {
  fs.readdir(directoryName, function(err, fileNames) {
    var tests = [];
    var pending = fileNames.length;

    if (err) {
      cb(err);
      return;
    }
    if (fileNames.length === 0) {
      cb(null, tests);
      return;
    }

    fileNames.forEach(function(fileName) {
      var fullName = path.join(directoryName, fileName);

      fs.stat(fullName, function(err, stat) {

        if (err) {
          cb(err);
          return;
        }

        if (stat.isDirectory()) {
          findTests(fullName, function(err, nested) {
            if (err) {
              cb(err);
              return;
            }

            tests.push.apply(tests, nested);

            pending--;
            if (pending === 0) {
              cb(null, tests);
            }
          });
          return;
        }

        if (testName.test(fullName)) {
          tests.push(fullName);
        }

        pending--;
        if (pending === 0) {
          cb(null, tests);
        }
      });
    });
  });
}

console.log("Indexing test files (searching in " + paths.test262 + ").");
findTests(paths.test262, function(err, testNames) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log("Indexing complete (" + testNames.length + " files found).");
  console.log("Testing...");

  var count = 0;
  var start = new Date().getTime();
  async.mapLimit(testNames, 20, function(testName, done) {
    fs.readFile(testName, { encoding: "utf-8" }, function(err, src) {
      var result;

      if (process.env.CACHED) {
        done(null);
        return;
      }

      count++;
      if (count % 1000 === 0) {
        console.log(
          count + "/" + testNames.length + " (" +
          (100*count/testNames.length).toFixed(2) + "%)"
        );
      }
      if (err) {
        done(err);
        return;
      }

      result = test(src);
      result.name = path.relative(paths.test262, testName);
      done(null, result);
    });
  }, function(err, results) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    if (!process.env.CACHED) {
      fs.writeFileSync("tmp.json", JSON.stringify(results, null, "  "));
    } else {
      results = require("../../tmp.json");
    }

    fs.readFile(paths.expectations, { encoding: "utf-8" }, function(err, src) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log(report({
        duration: new Date().getTime() - start,
        results: results,
        allowed: parseExpectations(src)
      }));
    });
  });
});
