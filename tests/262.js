#! /usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var testName = /^(?!.*_FIXTURE).*\.[jJ][sS]/;

var async = require('async');

var JSHint = require('../').JSHINT;

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

function firstError(data) {
  return data.errors && data.errors.find(function(obj) {
    return obj.code[0] === 'E';
  });
}
function padRight(len, str) {
  while (str.length < len) {
    str += ' ';
  }
  return str;
}
function printError(err, src) {
  var lines = src.split('\n');
  var gutterLen = String(err.line).length;

  console.log(padRight(gutterLen, err.line - 2) + ' | ' + lines[err.line - 2]);
  console.log(padRight(gutterLen, err.line - 1) + ' | ' + lines[err.line - 1]);
  console.log(padRight(gutterLen, '') + '   ' + new Array(err.character).join(' ') + '^');
  console.log(padRight(gutterLen, err.line) + ' | ' + lines[err.line]);
  console.log(err.reason);
}
function hasEarlyError(src) {
  return !!(src.match(/^\s*negative:\s*$/m) && src.match(/^\s+phase: early\s*$/m));
}

findTests(__dirname + '/test262/test', function(err, testNames) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  var count = 0;
  async.mapLimit(testNames, 20, function(testName, done) {
    fs.readFile(testName, { encoding: 'utf-8' }, function(err, src) {
      count++;
      if (count % 1000 === 0) {
        console.log(count + '/' + testNames.length + ' (' + (100*count/testNames.length).toFixed(2) + '%)');
      }
      if (err) {
        done(err);
        return;
      }

      var exception;
      try {
        JSHint(src, { esversion: 6 });
      } catch (e) {
        exception = e;
      }

      var data = JSHint.data();
      var err = firstError(data);
      var expected = hasEarlyError(src);
      if (exception || (!!err !== expected)) {
        done(null, {
          name: testName,
          type: err ? 'I' : 'II',
          exception: exception,
          errors: data.errors,
          //src: src,
        });
      } else {
        done(null, null);
      }
    });
  }, function(err, results) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    results = results.filter(function(result) { return result; });
    console.log(JSON.stringify(results, null, 2));
  });
});
