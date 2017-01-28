#! /usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');

var JSHint = require('../').JSHINT;
var parseIni = require('./parse-ini');

var paths = {
  test262: __dirname + '/test262/test',
  expectations: __dirname + '/262-expectations.ini'
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

function firstError(data) {
  return data.errors && data.errors.find(function(obj) {
    return obj.code[0] === 'E';
  });
}
function hasEarlyError(src) {
  return !!(src.match(/^\s*negative:\s*$/m) && src.match(/^\s+phase: early\s*$/m));
}
function test(src) {
  var exception;
  try {
    JSHint(src, { esversion: 6 });
  } catch (e) {
    exception = e;
  }

  var data = JSHint.data();
  var err = firstError(data);
  var expected = hasEarlyError(src);

  return {
    err: err,
    expected: expected,
    exception: exception,
    errors: data.errors
  };
}

console.log('Indexing test files (searching in ' + paths.test262 + ').');
findTests(paths.test262, function(err, testNames) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('Indexing complete (' + testNames.length + ' files found).');
  console.log('Testing...');

  var count = 0;
  var start = new Date().getTime();
  async.mapLimit(testNames, 20, function(testName, done) {
    fs.readFile(testName, { encoding: 'utf-8' }, function(err, src) {
      var result;

      if (process.env.CACHED) {
        done(null);
        return;
      }

      count++;
      if (count % 1000 === 0) {
        console.log(count + '/' + testNames.length + ' (' + (100*count/testNames.length).toFixed(2) + '%)');
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
    var expectationsFile;
    if (err) {
      console.error(err);
      process.exit(1);
    }
    if (!process.env.CACHED) {
      fs.writeFileSync('tmp.json', JSON.stringify(results, null, '  '));
    } else {
      results = require('../tmp.json');
    }

    fs.readFile(paths.expectations, { encoding: 'utf-8' }, function(err, src) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log(report({
        duration: new Date().getTime() - start,
        results: results,
        allowed: parseIni(src)
      }));
    });
  });
});


function report(summary) {
  var total = summary.results.length;
  var seconds = (summary.duration / 1000).toFixed(2);
  var expected = {
    success: 0,
    failure: 0,
    typeI: 0,
    typeII: 0
  };
  var unexpected = {
    success: [],
    failure: [],
    typeI: [],
    typeII: []
  };

  summary.results.forEach(function(result) {
    var allowed = summary.allowed[result.name];
    delete summary.allowed[result.name];

    if (!result.exception && (!!result.err === result.expected)) {
      if (allowed) {
        if (result.err) {
          unexpected.failure.push(result);
        } else {
          unexpected.success.push(result);
        }
      } else {
        if (result.err) {
          expected.failure++;
        } else {
          expected.success++;
        }
      }
    } else {
      if (allowed) {
        if (result.err) {
          expected.typeI++;
        } else {
          expected.typeII++;
        }
      } else {
        if (result.err) {
          unexpected.typeI.push(result);
        } else {
          unexpected.typeII.push(result);
        }
      }
    }
  });

  var lines = [
    'Results:',
    '',
    total + ' total programs parsed in ' + seconds + ' seconds.',
    '',
    expected.success + ' valid programs parsed successfully',
    expected.failure + ' invalid programs produced parsing errors',
    expected.typeI + ' invalid programs parsed successfully (in accordance with expectation file)',
    expected.typeII + ' valid programs produced parsing errors (in accordance with expectation file)',
    '',
    'WW valid programs parsed successfully (in violation of expectation file):',
    'XX invalid programs produced parsing errors (in violation of expectation file):',
    'YY invalid programs parsed successfully (without a corresponding entry in expectation file):',
    'ZZ valid programs produced parsing errors (without a corresponding entry in expectation file):',
    '',
    'ZZ programs were referenced by the "whitelist" file but not parsed in this test run:',
  ];

  return lines.join('\n');
}
