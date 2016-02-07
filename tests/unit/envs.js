/**
 * Tests for the environmental (browser, jquery, etc.) options
 */

"use strict";

var JSHINT  = require("../..").JSHINT;
var fs      = require('fs');
var TestRun = require("../helpers/testhelper").setup.testRun;
var assert  = require('assert');

function wrap(globals) {
  return '(function () { return [ ' + globals.join(',') + ' ]; }());';
}

function globalsKnown(globals, options) {
  JSHINT(wrap(globals), options || {});
  var report = JSHINT.data();

  assert(report.implied === undefined);
  assert.equal(report.globals.length, globals.length);

  for (var i = 0, g; g = report.globals[i]; i += 1)
    globals[g] = true;

  for (i = 0, g = null; g = globals[i]; i += 1)
    assert(g in globals);
}

function globalsImplied(globals, options) {
  JSHINT(wrap(globals), options || {});
  var report = JSHINT.data();

  assert(report.implieds != null);
  assert(report.globals === undefined);

  var implieds = [];
  for (var i = 0, warn; warn = report.implieds[i]; i += 1)
    implieds.push(warn.name);

  assert.equal(implieds.length, globals.length);
}

/*
 * Option `node` predefines Node.js (v 0.5.9) globals
 *
 * More info:
 *  + http://nodejs.org/docs/v0.5.9/api/globals.html
 */
exports.node = function () {
  // Node environment assumes `globalstrict`
  var globalStrict = [
    '"use strict";',
    "function test() { return; }",
  ].join('\n');

  TestRun()
    .addError(1, 'Use the function form of "use strict".')
    .test(globalStrict, { es3: true, strict: true });

  TestRun()
    .test(globalStrict, { es3: true, node: true, strict: true });

  TestRun()
    .test(globalStrict, { es3: true, browserify: true, strict: true });

  // Don't assume strict:true for Node environments. See bug GH-721.
  TestRun()
    .test("function test() { return; }", { es3: true, node: true });

  TestRun()
    .test("function test() { return; }", { es3: true, browserify: true });

  // Make sure that we can do fancy Node export

  var overwrites = [
    "global = {};",
    "Buffer = {};",
    "exports = module.exports = {};"
  ];

  TestRun()
    .addError(1, "Read only.")
    .test(overwrites, { es3: true, node: true });

  TestRun()
    .addError(1, "Read only.")
    .test(overwrites, { es3: true, browserify: true });

  TestRun( "gh-2657")
    .test("'use strict';var a;", { node: true });

};

exports.typed = function () {
  var globals = [
    "ArrayBuffer",
    "ArrayBufferView",
    "DataView",
    "Float32Array",
    "Float64Array",
    "Int16Array",
    "Int32Array",
    "Int8Array",
    "Uint16Array",
    "Uint32Array",
    "Uint8Array",
    "Uint8ClampedArray"
  ];

  globalsImplied(globals);
  globalsKnown(globals, { browser: true });
  globalsKnown(globals, { node: true });
  globalsKnown(globals, { typed: true });

};

exports.es5 = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/es5.js", "utf8");

  TestRun()
    .addError(3, "Extra comma. (it breaks older versions of IE)")
    .addError(8, "Extra comma. (it breaks older versions of IE)")
    .addError(15, "get/set are ES5 features.")
    .addError(16, "get/set are ES5 features.")
    .addError(20, "get/set are ES5 features.")
    .addError(22, "get/set are ES5 features.")
    .addError(26, "get/set are ES5 features.")
    .addError(30, "get/set are ES5 features.")
    .addError(31, "get/set are ES5 features.")
    .addError(36, "get/set are ES5 features.")
    .addError(41, "get/set are ES5 features.")
    .addError(42, "get/set are ES5 features.")
    .addError(43, "Duplicate key 'x'.")
    .addError(47, "get/set are ES5 features.")
    .addError(48, "get/set are ES5 features.")
    .addError(48, "Duplicate key 'x'.")
    .addError(52, "get/set are ES5 features.")
    .addError(53, "get/set are ES5 features.")
    .addError(54, "get/set are ES5 features.")
    .addError(54, "Duplicate key 'x'.")
    .addError(58, "get/set are ES5 features.")
    .addError(58, "Unexpected parameter 'a' in get x function.")
    .addError(59, "get/set are ES5 features.")
    .addError(59, "Unexpected parameter 'a' in get y function.")
    .addError(60, "get/set are ES5 features.")
    .addError(62, "get/set are ES5 features.")
    .addError(62, "Expected a single parameter in set x function.")
    .addError(63, "get/set are ES5 features.")
    .addError(64, "get/set are ES5 features.")
    .addError(64, "Expected a single parameter in set z function.")
    .addError(68, "get/set are ES5 features.")
    .addError(69, "get/set are ES5 features.")
    .addError(68, "Missing property name.")
    .addError(69, "Missing property name.")
    .addError(75, "get/set are ES5 features.")
    .addError(76, "get/set are ES5 features.")
    .addError(80, "get/set are ES5 features.")
    .test(src, { es3: true });

  TestRun()
    .addError(36, "Setter is defined without getter.")
    .addError(43, "Duplicate key 'x'.")
    .addError(48, "Duplicate key 'x'.")
    .addError(54, "Duplicate key 'x'.")
    .addError(58, "Unexpected parameter 'a' in get x function.")
    .addError(59, "Unexpected parameter 'a' in get y function.")
    .addError(62, "Expected a single parameter in set x function.")
    .addError(64, "Expected a single parameter in set z function.")
    .addError(68, "Missing property name.")
    .addError(69, "Missing property name.")
    .addError(80, "Setter is defined without getter.")
    .test(src, {  }); // es5

  // JSHint should not throw "Missing property name" error on nameless getters/setters
  // using Method Definition Shorthand if esnext flag is enabled.
  TestRun()
    .addError(36, "Setter is defined without getter.")
    .addError(43, "Duplicate key 'x'.")
    .addError(48, "Duplicate key 'x'.")
    .addError(54, "Duplicate key 'x'.")
    .addError(58, "Unexpected parameter 'a' in get x function.")
    .addError(59, "Unexpected parameter 'a' in get y function.")
    .addError(62, "Expected a single parameter in set x function.")
    .addError(64, "Expected a single parameter in set z function.")
    .addError(80, "Setter is defined without getter.")
    .test(src, { esnext: true });

  // Make sure that JSHint parses getters/setters as function expressions
  // (https://github.com/jshint/jshint/issues/96)
  src = fs.readFileSync(__dirname + "/fixtures/es5.funcexpr.js", "utf8");
  TestRun().test(src, {  }); // es5

};

exports.phantom = function () {
  // Phantom environment assumes `globalstrict`
  var globalStrict = [
    '"use strict";',
    "function test() { return; }",
  ].join('\n');

  TestRun()
    .addError(1, 'Use the function form of "use strict".')
    .test(globalStrict, { es3: true, strict: true });

  TestRun()
    .test(globalStrict, { es3: true, phantom: true, strict: true });


};
