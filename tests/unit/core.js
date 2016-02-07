"use strict";

var JSHINT  = require("../..").JSHINT;
var fs      = require('fs');
var TestRun = require("../helpers/testhelper").setup.testRun;
var assert  = require('assert');

/**
 * JSHint allows you to specify custom globals as a parameter to the JSHINT
 * function so it is not necessary to spam code with jshint-related comments
 */
exports.testCustomGlobals = function () {
  var code   = '(function () { return [ fooGlobal, barGlobal ]; }());';
  var custom = { fooGlobal: false, barGlobal: false };

  assert(JSHINT(code, {}, custom));

  var report = JSHINT.data();
  assert.strictEqual(report.implieds, undefined);
  assert.equal(report.globals.length, 2);

  var dict = {};
  for (var i = 0, g; g = report.globals[i]; i += 1)
    dict[g] = true;

  var customKeys = Object.keys(custom);
  for (i = 0, g = null; g = customKeys[i]; i += 1)
    assert(g in dict);

  // Regression test (GH-665)
  code = [
    "/*global bar*/",
    "foo = {};",
    "bar = {};"
  ];

  TestRun()
    .addError(2, "Read only.")
    .addError(3, "Read only.")
    .test(code, { es3: true, unused: true, predef: { foo: false }});

};

exports.testUnusedDefinedGlobals = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/unusedglobals.js", "utf8");

  TestRun()
    .addError(2, "'bar' is defined but never used.")
    .test(src, { es3: true, unused: true });

};

exports.testImplieds = function () {
  var src = [
    "f = 0;",
    "(function() {",
    "  g = 0;",
    "}());",
    "h = 0;"
  ];
  var report;

  TestRun().test(src);
  report = JSHINT.data();

  assert.deepEqual(
    report.implieds,
    [
      { name: "f", line: [1] },
      { name: "g", line: [3] },
      { name: "h", line: [5] }
    ]
  );

  TestRun()
    .test("__proto__ = 0;", { proto: true });
  report = JSHINT.data();

  assert.deepEqual(report.implieds, [ { name: "__proto__", line: [1] } ]);

};

exports.testExportedDefinedGlobals = function () {
  var src = ["/*global foo, bar */",
    "export { bar, foo };"];

  // Test should pass
  TestRun().test(src, { esnext: true, unused: true }, {});

  var report = JSHINT.data();
  assert.deepEqual(report.globals, ['bar', 'foo']);

};

exports.testGlobalVarDeclarations = function () {
  var src = "var a;";

  // Test should pass
  TestRun().test(src, { es3: true, node: true }, {});

  var report = JSHINT.data();
  assert.deepEqual(report.globals, ['a']);

  TestRun().test("var __proto__;", { proto: true });
  report = JSHINT.data();
  assert.deepEqual(report.globals, ["__proto__"]);

};

exports.globalDeclarations = function () {
  var src = "exports = module.exports = function () {};";

  // Test should pass
  TestRun().test(src, { es3: true, node: true }, { exports: true });

  // Test should pass as well
  src = [
    "/*jshint node:true */",
    "/*global exports:true */",
    "exports = module.exports = function () {};"
  ];

  TestRun().test(src.join('\n'));

};

exports.multilineGlobalDeclarations = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/multiline-global-declarations.js", "utf8");

  TestRun()
    .addError(12, "'pi' is defined but never used.")
    .test(src, { unused: true });

};

/** Test that JSHint recognizes `new Array(<expr>)` as a valid expression */
exports.testNewArray = function () {
  var code  = 'new Array(1);';
  var code1 = 'new Array(v + 1);';
  var code2 = 'new Array("hello", "there", "chaps");';

  TestRun().test(code);
  TestRun().test(code1);
  TestRun().test(code2);

  TestRun()
    .addError(1, "The array literal notation [] is preferable.")
    .test('new Array();');

};

/** Test that JSHint recognizes `new foo.Array(<expr>)` as a valid expression #527 **/
exports.testNewNonNativeArray = function () {
  var code  = 'new foo.Array();';
  var code1 = 'new foo.Array(1);';
  var code2 = 'new foo.Array(v + 1);';
  var code3 = 'new foo.Array("hello", "there", "chaps");';

  TestRun().test(code);
  TestRun().test(code1);
  TestRun().test(code2);
  TestRun().test(code3);

};

exports.testNonNativeArray = function () {
  var code1 = 'foo.Array();';
  var code2 = 'foo.Array(v + 1);';
  var code3 = 'foo.Array("hello", "there", "chaps");';

  TestRun().test(code1);
  TestRun().test(code2);
  TestRun().test(code3);

};


/** Test that JSHint recognizes `new Object(<expr>)` as a valid expression */
exports.testNewObject = function () {
  var code  = 'Object(1);';
  var code1 = 'new Object(1);';

  TestRun().test(code);
  TestRun().test(code1);

  TestRun()
    .addError(1, "The object literal notation {} is preferable.")
    .test('Object();');

  TestRun()
    .addError(1, "The object literal notation {} is preferable.")
    .test('new Object();');

};

/** Test that JSHint recognizes `new foo.Object(<expr>)` as a valid expression #527 **/
exports.testNewNonNativeObject = function () {
  var code  = 'new foo.Object();';
  var code1 = 'new foo.Object(1);';
  var code2 = 'foo.Object();';
  var code3 = 'foo.Object(1);';

  TestRun().test(code);
  TestRun().test(code1);
  TestRun().test(code2);
  TestRun().test(code3);

};


/**
 * Test that JSHint allows `undefined` to be a function parameter.
 * It is a common pattern to protect against the case when somebody
 * overwrites undefined. It also helps with minification.
 *
 * More info: https://gist.github.com/315916
 */
exports.testUndefinedAsParam = function () {
  var code  = '(function (undefined) {}());';
  var code1 = 'var undefined = 1;';

  TestRun().test(code);

  // But it must never tolerate reassigning of undefined
  TestRun()
    .addError(1, "Expected an identifier and instead saw 'undefined' (a reserved word).")
    .test(code1);

};

/** Tests that JSHint accepts new line after a dot (.) operator */
exports.newLineAfterDot = function () {
  TestRun().test([ "chain().chain().", "chain();" ]);
};

/**
 * JSHint does not tolerate deleting variables.
 * More info: http://perfectionkills.com/understanding-delete/
 */
exports.noDelete = function () {
  TestRun()
    .addError(1, 'Variables should not be deleted.')
    .test('delete NullReference;');

};

/**
 * JSHint allows case statement fall through only when it is made explicit
 * using special comments.
 */
exports.switchFallThrough = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/switchFallThrough.js', 'utf8');
  TestRun()
    .addError(3, "Expected a 'break' statement before 'case'.")
    .addError(18, "Expected a 'break' statement before 'default'.")
    .addError(40, "Unexpected ':'.")
    .test(src);

};

// GH-490: JSHint shouldn't require break before default if default is
// the first switch statement.
exports.switchDefaultFirst = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/switchDefaultFirst.js", "utf8");

  TestRun()
    .addError(5, "Expected a 'break' statement before 'default'.")
    .test(src);

};

exports.testVoid = function () {
  var code = [
    "void(0);",
    "void 0;",
    "var a = void(1);"
  ];
  TestRun().test(code);

};

exports.functionScopedOptions = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/functionScopedOptions.js', 'utf8');
  TestRun()
    .addError(1, "eval can be harmful.")
    .addError(8, "eval can be harmful.")
    .test(src);

};

/** JSHint should not only read jshint, but also jslint options */
exports.jslintOptions = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/jslintOptions.js', 'utf8');
  TestRun().test(src);

};

exports.jslintInverted = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/jslintInverted.js', 'utf8');
  TestRun().test(src);

};

exports.jslintRenamed = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/jslintRenamed.js', 'utf8');
  TestRun()
    .addError(4, "Expected '===' and instead saw '=='.")
    .test(src);

};

exports.jslintSloppy = function () {
  var src = "/*jslint sloppy:true */ function test() { return 1; }";

  TestRun()
    .test(src);

};

/** JSHint should ignore unrecognized jslint options */
exports.jslintUnrecognized = function () {
  var src = "/*jslint closure:true */ function test() { return 1; }";

  TestRun()
    .test(src);

};

exports.caseExpressions = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/caseExpressions.js', 'utf8');
  TestRun()
    .test(src);

};

exports.returnStatement = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/return.js', 'utf8');

  TestRun()
    .addError(3, "Did you mean to return a conditional instead of an assignment?")
    .addError(38, "Line breaking error 'return'.")
    .addError(38, "Missing semicolon.")
    .addError(39, "Unnecessary semicolon.")
    .test(src, { es3: true });

};

exports.argsInCatchReused = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/trycatch.js', 'utf8');
  TestRun()
    .addError(6, "'e' is already defined.")
    .addError(12, "Do not assign to the exception parameter.")
    .addError(13, "Do not assign to the exception parameter.")
    .addError(24, "'e' is not defined.")
    .test(src, { es3: true, undef: true });

};

exports.testRawOnError = function () {
  JSHINT(';', { maxerr: 1 });
  assert.equal(JSHINT.errors[0].raw, 'Unnecessary semicolon.');
  assert.equal(JSHINT.errors[1].raw, 'Too many errors.');
  assert.equal(JSHINT.errors[2], null);

};

exports.yesEmptyStmt = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/emptystmt.js', 'utf8');

  TestRun()
    .addError(1, "Expected an identifier and instead saw ';'.")
    .addError(6, "Expected an assignment or function call and instead saw an expression.")
    .addError(10, "Unnecessary semicolon.")
    .addError(17, "Unnecessary semicolon.")
    .test(src, { es3: true, curly: false });

  TestRun()
    .addError(1, "Expected an identifier and instead saw ';'.")
    .addError(10, "Unnecessary semicolon.")
    .addError(17, "Unnecessary semicolon.")
    .test(src, { es3: true, curly: false, expr: true });

};

exports.insideEval = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/insideEval.js', 'utf8');

  TestRun()
    .addError(1, "eval can be harmful.")
    .addError(3, "eval can be harmful.")
    .addError(5, "eval can be harmful.")
    .addError(7, "eval can be harmful.")
    .addError(9, "eval can be harmful.")
    .addError(11, "Implied eval. Consider passing a function instead of a string.")
    .addError(13, "Implied eval. Consider passing a function instead of a string.")
    .addError(15, "Implied eval. Consider passing a function instead of a string.")
    .addError(17, "Implied eval. Consider passing a function instead of a string.")

    // The "TestRun" class (and these errors) probably needs some
    // facility for checking the expected scope of the error
    .addError(1, "Unexpected early end of program.")
    .addError(1, "Unrecoverable syntax error. (100% scanned).")
    .addError(1, "Unrecoverable syntax error. (100% scanned).")

    .test(src, { es3: true, evil: false });

  // Regression test for bug GH-714.
  JSHINT(src, { evil: false, maxerr: 1 });
  var err = JSHINT.data().errors[1];
  assert.equal(err.raw, "Too many errors.");
  assert.equal(err.scope, "(main)");

};

exports.escapedEvil = function () {
  var code = [
    "\\u0065val(\"'test'\");"
  ];

  TestRun()
    .addError(1, "eval can be harmful.")
    .test(code, { evil: false });

};

// Regression test for GH-394.
exports.noExcOnTooManyUndefined = function () {
  var code = 'a(); b();';

  try {
    JSHINT(code, {undef: true, maxerr: 1});
  } catch (e) {
    assert(false, 'Exception was thrown');
  }

  TestRun()
    .addError(1, "'a' is not defined.")
    .addError(1, "'b' is not defined.")
    .test(code, { es3: true, undef: true });

};

exports.defensiveSemicolon = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/gh-226.js', 'utf8');

  TestRun()
    .addError(16, "Unnecessary semicolon.")
    .addError(17, "Unnecessary semicolon.")
    .test(src, { es3: true, expr: true, laxbreak: true });

};

// Test different variants of IIFE
exports.iife = function () {
  var iife = [
    '(function () { return; }());',
    '(function () { return; })();'
  ];

  TestRun().test(iife.join('\n'));

};

// Tests invalid options when they're passed as function arguments
// For code that tests /*jshint ... */ see parser.js
exports.invalidOptions = function () {
  TestRun()
    .addError(0, "Bad option: 'invalid'.")
    .test("function test() {}", { es3: true, devel: true, invalid: true });

};

exports.multilineArray = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/gh-334.js', 'utf8');

  TestRun().test(src);

};

exports.testInvalidSource = function () {
  TestRun()
    .addError(0, "Input is neither a string nor an array of strings.")
    .test(undefined);

  TestRun()
    .addError(0, "Input is neither a string nor an array of strings.")
    .test(null);

  TestRun()
    .addError(0, "Input is neither a string nor an array of strings.")
    .test({}, {es3: true});

  TestRun()
    .test("", {es3: true});

  TestRun()
    .test([], {es3: true});

};

exports.testConstructor = function () {
  var code = "new Number(5);";

  TestRun()
    .addError(1, "Do not use Number as a constructor.", {
      character: 1
    })
    .test(code, {es3: true});

};

exports.missingRadix = function () {
  var code = "parseInt(20);";

  TestRun()
    .addError(1, "Missing radix parameter.", {
      character: 12
    })
    .test(code, {es3: true});

  TestRun().test(code);

};

exports.NumberNaN = function () {
  var code = "(function () { return Number.NaN; })();";
  TestRun().test(code, {es3: true});

};

exports.htmlEscapement = function () {
  TestRun().test("var a = '<\\!--';", {es3: true});
  TestRun()
    .test("var a = '\\!';", {es3: true});

};

// GH-551 regression test.
exports.testSparseArrays = function () {
  var src = "var arr = ['a',, null,, '',, undefined,,];";

  TestRun()
    .addError(1, "Extra comma. (it breaks older versions of IE)")
    .addError(1, "Extra comma. (it breaks older versions of IE)")
    .addError(1, "Extra comma. (it breaks older versions of IE)")
    .addError(1, "Extra comma. (it breaks older versions of IE)")
    .test(src, {es3: true});

  TestRun()
    .test(src, { elision: true }); // es5

};

exports.testReserved = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/reserved.js", "utf8");

  TestRun()
    .addError(1, "Expected an identifier and instead saw 'volatile' (a reserved word).")
    .addError(5, "Expected an identifier and instead saw 'let' (a reserved word).")
    .addError(10, "Expected an identifier and instead saw 'let' (a reserved word).")
    .addError(13, "Expected an identifier and instead saw 'class' (a reserved word).")
    .addError(14, "Expected an identifier and instead saw 'else' (a reserved word).")
    .addError(15, "Expected an identifier and instead saw 'protected' (a reserved word).")
    .test(src, {es3: true});

  TestRun()
    .addError(5, "Expected an identifier and instead saw 'let' (a reserved word).")
    .addError(10, "Expected an identifier and instead saw 'let' (a reserved word).")
    .test(src, {}); // es5

};

// GH-744: Prohibit the use of reserved words as non-property
// identifiers.
exports.testES5Reserved = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/es5Reserved.js", "utf8");

  TestRun()
    .addError(2, "Expected an identifier and instead saw 'default' (a reserved word).")
    .addError(3, "Unexpected 'in'.")
    .addError(3, "Expected an identifier and instead saw 'in' (a reserved word).")
    .addError(6, "Expected an identifier and instead saw 'default' (a reserved word).")
    .addError(7, "Expected an identifier and instead saw 'new' (a reserved word).")
    .addError(8, "Expected an identifier and instead saw 'class' (a reserved word).")
    .addError(9, "Expected an identifier and instead saw 'default' (a reserved word).")
    .addError(10, "Expected an identifier and instead saw 'in' (a reserved word).")
    .addError(11, "Expected an identifier and instead saw 'in' (a reserved word).")
    .test(src, {es3: true});

  TestRun()
    .addError(6, "Expected an identifier and instead saw 'default' (a reserved word).")
    .addError(7, "Expected an identifier and instead saw 'new' (a reserved word).")
    .addError(8, "Expected an identifier and instead saw 'class' (a reserved word).")
    .addError(11, "Expected an identifier and instead saw 'in' (a reserved word).")
    .test(src, {}); // es5

};

exports.testCatchBlocks = function () {
  var src = fs.readFileSync(__dirname + '/fixtures/gh247.js', 'utf8');

  TestRun()
    .addError(19, "'w' is already defined.")
    .addError(35, "'u2' used out of scope.")
    .addError(36, "'w2' used out of scope.")
    .test(src, { es3: true, undef: true, devel: true });

  src = fs.readFileSync(__dirname + '/fixtures/gh618.js', 'utf8');

  TestRun()
    .addError(5, "Value of 'x' may be overwritten in IE 8 and earlier.")
    .addError(15, "Value of 'y' may be overwritten in IE 8 and earlier.")
    .test(src, { es3: true, undef: true, devel: true });

  TestRun()
    .test(src, { es3: true, undef: true, devel: true, node: true });

  var code = "try {} catch ({ message }) {}";

  TestRun( "destructuring in catch blocks' parameter")
    .test(code, { esnext: true });

};

exports.testNumericParams = function () {
  TestRun()
    .test("/*jshint maxparams:4, indent:3, maxlen:false */");

  TestRun()
    .addError(1, "Expected a small integer or 'false' and instead saw 'face'.")
    .test("/*jshint maxparams:face */");

};

exports.testForIn = function () {
  var src = [
    "(function (o) {",
    "for (var i in o) { i(); }",
    "}());"
  ];

  TestRun()
    .test(src, {es3: true});

  src = [
    "(function (o) {",
    "for (i in o) { i(); }",
    "}());"
  ];

  TestRun()
    .addError(2, "Creating global 'for' variable. Should be 'for (var i ...'.")
    .test(src, {es3: true});

  src = [
    "(function (o) {",
    "for ('i' in o) { i(); }",
    "}());"
  ];

  TestRun()
    .addError(2, "Expected an identifier and instead saw 'i'.")
    .test(src);

  src = [
    "(function (o) {",
    "for (i, j in o) { i(); }",
    "for (var x, u in o) { x(); }",
    "for (z = 0 in o) { z(); }",
    "for (var q = 0 in o) { q(); }",
    "})();"
  ];

  TestRun( "bad lhs errors")
    .addError(2, "Invalid for-in loop left-hand-side: more than one ForBinding.")
    .addError(3, "Invalid for-in loop left-hand-side: more than one ForBinding.")
    .addError(4, "Invalid for-in loop left-hand-side: initializer is forbidden.")
    .addError(5, "Invalid for-in loop left-hand-side: initializer is forbidden.")
    .test(src);

  src = [
    "(function (o) {",
    "for (let i, j in o) { i(); }",
    "for (const x, u in o) { x(); }",
    "for (let z = 0 in o) { z(); }",
    "for (const q = 0 in o) { q(); }",
    "})();"
  ];

  TestRun( "bad lhs errors (lexical)")
    .addError(2, "Invalid for-in loop left-hand-side: more than one ForBinding.")
    .addError(3, "Invalid for-in loop left-hand-side: more than one ForBinding.")
    .addError(4, "Invalid for-in loop left-hand-side: initializer is forbidden.")
    .addError(5, "Invalid for-in loop left-hand-side: initializer is forbidden.")
    .test(src, { esnext: true });

};

exports.testRegexArray = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/regex_array.js", "utf8");

  TestRun()
    .test(src, {es3: true});

};

// Regression test for GH-1070
exports.testUndefinedAssignment = function () {
  var src = [
    "var x = undefined;",
    "const y = undefined;",
    "let z = undefined;",
    "for(var a = undefined; a < 9; a++) {",
    "  var b = undefined;", // necessary - see gh-1191
    "  const c = undefined;",
    "  let d = undefined;",
    "  var e = function() {",
    "    var f = undefined;",
    "    const g = undefined;",
    "    let h = undefined;",
    "  };",
    "}",
    "// jshint -W080",
    "var i = undefined;",
    "const j = undefined;",
    "let k = undefined;",
    "// jshint +W080",
    "var l = undefined === 0;",
    "const m = undefined === 0;",
    "let n = undefined === 0;",
    "let [ o = undefined === 0 ] = [];",
    "[ o = undefined === 0] = [];",
    "let { p = undefined === 0, x: q = undefined === 0 } = {};",
    "({ p = undefined === 0, x: q = undefined === 0 } = {});"
  ];

  TestRun()
    .addError(1, "It's not necessary to initialize 'x' to 'undefined'.")
    .addError(2, "It's not necessary to initialize 'y' to 'undefined'.")
    .addError(3, "It's not necessary to initialize 'z' to 'undefined'.")
    .addError(4, "It's not necessary to initialize 'a' to 'undefined'.")
    .addError(6, "It's not necessary to initialize 'c' to 'undefined'.")
    .addError(7, "It's not necessary to initialize 'd' to 'undefined'.")
    .addError(9, "It's not necessary to initialize 'f' to 'undefined'.")
    .addError(10, "It's not necessary to initialize 'g' to 'undefined'.")
    .addError(11, "It's not necessary to initialize 'h' to 'undefined'.")
    .test(src, {esnext: true});

};

exports.testES6Modules = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/es6-import-export.js", "utf8");

  var importConstErrors = [
    [51, "Attempting to override '$' which is a constant."],
    [52, "Attempting to override 'emGet' which is a constant."],
    [53, "Attempting to override 'one' which is a constant."],
    [54, "Attempting to override '_' which is a constant."],
    [55, "Attempting to override 'ember2' which is a constant."],
    [57, "'$' has already been declared."],
    [58, "'emGet' has already been declared."],
    [58, "'set' has already been declared."],
    [59, "'_' has already been declared."],
    [60, "'ember2' has already been declared."],
    [65, "'newImport' was used before it was declared, which is illegal for 'const' variables."]
  ];

  var testRun = TestRun();
  importConstErrors.forEach(function(error) { testRun.addError.apply(testRun, error); });
  testRun.test(src, {esnext: true});

  testRun = TestRun()
    .addError(3, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(4, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(5, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(6, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(7, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(8, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(9, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(10, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(11, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(22, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(26, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(30, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(31, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(32, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(36, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(40, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(44, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(46, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(47, "'class' is available in ES6 (use 'esversion: 6') or Mozilla JS extensions (use moz).")
    .addError(48, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(48, "'class' is available in ES6 (use 'esversion: 6') or Mozilla JS extensions (use moz).")
    .addError(47, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(46, "'class' is available in ES6 (use 'esversion: 6') or Mozilla JS extensions (use moz).")
    .addError(57, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(58, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(59, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(60, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(65, "'import' is only available in ES6 (use 'esversion: 6').")
    .addError(67, "'export' is only available in ES6 (use 'esversion: 6').")
    .addError(67, "'function*' is only available in ES6 (use 'esversion: 6').")
    .addError(67, "'yield' is available in ES6 (use 'esversion: 6') or Mozilla JS extensions (use moz).");
  importConstErrors.forEach(function(error) { testRun.addError.apply(testRun, error); });
  testRun.test(src, {});

  var src2 = [
    "var a = {",
    "import: 'foo',",
    "export: 'bar'",
    "};"
  ];

  TestRun()
    .test(src2, {});

};

exports.testES6ModulesNamedExportsAffectUnused = function () {
  // Named Exports should count as used
  var src1 = [
    "var a = {",
    "  foo: 'foo',",
    "  bar: 'bar'",
    "};",
    "var x = 23;",
    "var z = 42;",
    "let c = 2;",
    "const d = 7;",
    "export { c, d };",
    "export { a, x };",
    "export var b = { baz: 'baz' };",
    "export function boo() { return z; }",
    "export class MyClass { }",
    "export var varone = 1, vartwo = 2;",
    "export const constone = 1, consttwo = 2;",
    "export let letone = 1, lettwo = 2;",
    "export var v1u, v2u;",
    "export let l1u, l2u;",
    "export const c1u, c2u;",
    "export function* gen() { yield 1; }"
  ];

  TestRun()
    .addError(19, "const 'c1u' is initialized to 'undefined'.")
    .addError(19, "const 'c2u' is initialized to 'undefined'.")
    .test(src1, {
      esnext: true,
      unused: true
    });

};

exports.testConstRedeclaration = function () {

  // consts cannot be redeclared, but they can shadow
  var src = [
    "const a = 1;",
    "const a = 2;",
    "if (a) {",
    "  const a = 3;",
    "}",
    "for(const a in a) {",
    "  const a = 4;",
    "}",
    "function a() {",
    "}",
    "function b() {",
    "}",
    "const b = 1;"
  ];

  TestRun()
      .addError(2, "'a' has already been declared.")
      .addError(9, "'a' has already been declared.")
      .addError(13, "'b' has already been declared.")
      .test(src, {
        esnext: true
      });

};

exports["test typeof in TDZ"] = function () {

  var src = [
    "let a = typeof b;", // error, use in TDZ
    "let b;",
    "function d() { return typeof c; }", // d may be called after declaration, no error
    "let c = typeof e;", // e is not in scope, no error
    "{",
    "  let e;",
    "}"
  ];

  TestRun()
    .addError(2, "'b' was used before it was declared, which is illegal for 'let' variables.")
    .test(src, {
      esnext: true
    });

};

exports.testConstModification = function () {

  var src = [
    "const a = 1;",
    "const b = { a: 2 };",
    // const errors
    "a = 2;",
    "b = 2;",
    "a++;",
    "--a;",
    "a += 1;",
    "let y = a = 3;",
    // valid const access
    "b.a++;",
    "--b.a;",
    "b.a = 3;",
    "a.b += 1;",
    "const c = () => 1;",
    "c();",
    "const d = [1, 2, 3];",
    "d[0] = 2;",
    "let x = -a;",
    "x = +a;",
    "x = a + 1;",
    "x = a * 2;",
    "x = a / 2;",
    "x = a % 2;",
    "x = a & 1;",
    "x = a ^ 1;",
    "x = a === true;",
    "x = a == 1;",
    "x = a !== true;",
    "x = a != 1;",
    "x = a > 1;",
    "x = a >= 1;",
    "x = a < 1;",
    "x = a <= 1;",
    "x = 1 + a;",
    "x = 2 * a;",
    "x = 2 / a;",
    "x = 2 % a;",
    "x = 1 & a;",
    "x = 1 ^ a;",
    "x = true === a;",
    "x = 1 == a;",
    "x = true !== a;",
    "x = 1 != a;",
    "x = 1 > a;",
    "x = 1 >= a;",
    "x = 1 < a;",
    "x = 1 <= a;",
    "x = typeof a;",
    "x = a.a;",
    "x = a[0];",
    "delete a.a;",
    "delete a[0];",
    "new a();",
    "new a;",
    "function e() {",
    "  f++;",
    "}",
    "const f = 1;",
    "e();"
  ];

  TestRun()
      .addError(3, "Attempting to override 'a' which is a constant.")
      .addError(4, "Attempting to override 'b' which is a constant.")
      .addError(5, "Attempting to override 'a' which is a constant.")
      .addError(6, "Attempting to override 'a' which is a constant.")
      .addError(7, "Attempting to override 'a' which is a constant.")
      .addError(8, "Attempting to override 'a' which is a constant.")
      .addError(8, "You might be leaking a variable (a) here.")
      .addError(53, "Missing '()' invoking a constructor.")
      .addError(55, "Attempting to override 'f' which is a constant.")
      .test(src, {
        esnext: true
      });

};

exports["class declaration export"] = function () {
  var source = fs.readFileSync(__dirname + "/fixtures/class-declaration.js", "utf8");

  TestRun().test(source, {
    esnext: true,
    undef: true
  });

};

exports["function declaration export"] = function () {
  var source = fs.readFileSync(__dirname + "/fixtures/function-declaration.js", "utf8");

  TestRun().test(source, {
    esnext: true,
    undef: true
  });

};

exports.classIsBlockScoped = function () {
  var code = [
    "new A();", // use in TDZ
    "class A {}",
    "class B extends C {}", // use in TDZ
    "class C {}",
    "new D();", // not defined
    "let E = class D {" +
    "  constructor() { D.static(); }",
    "  myfunc() { return D; }",
    "};",
    "new D();", // not defined
    "if (true) {",
    "  class F {}",
    "}",
    "new F();" // not defined
  ];

  TestRun()
    .addError(2, "'A' was used before it was declared, which is illegal for 'class' variables.")
    .addError(4, "'C' was used before it was declared, which is illegal for 'class' variables.")
    .addError(5, "'D' is not defined.")
    .addError(9, "'D' is not defined.")
    .addError(13, "'F' is not defined.")
    .test(code, { esnext: true, undef: true });

};

exports.testES6ModulesNamedExportsAffectUndef = function () {
  // The identifier "foo" is expected to have been defined in the scope
  // of this file in order to be exported.
  // The example below is roughly similar to this Common JS:
  //
  //     exports.foo = foo;
  //
  // Thus, the "foo" identifier should be seen as undefined.
  var src1 = [
    "export { foo };"
  ];

  TestRun()
    .addError(1, "'foo' is not defined.")
    .test(src1, {
      esnext: true,
      undef: true
    });

};

exports.testES6ModulesThroughExportDoNotAffectUnused = function () {
  // "Through" exports do not alter the scope of this file, but instead pass
  // the exports from one source on through this source.
  // The example below is roughly similar to this Common JS:
  //
  //     var foo;
  //     exports.foo = require('source').foo;
  //
  // Thus, the "foo" identifier should be seen as unused.
  var src1 = [
    "var foo;",
    "export { foo } from \"source\";"
  ];

  TestRun()
    .addError(1, "'foo' is defined but never used.")
    .test(src1, {
      esnext: true,
      unused: true
    });

};

exports.testES6ModulesThroughExportDoNotAffectUndef = function () {
  // "Through" exports do not alter the scope of this file, but instead pass
  // the exports from one source on through this source.
  // The example below is roughly similar to this Common JS:
  //
  //     exports.foo = require('source').foo;
  //     var bar = foo;
  //
  // Thus, the "foo" identifier should be seen as undefined.
  var src1 = [
    "export { foo } from \"source\";",
    "var bar = foo;"
  ];

  TestRun()
    .addError(2, "'foo' is not defined.")
    .test(src1, {
      esnext: true,
      undef: true
    });

};

exports.testES6ModulesDefaultExportsAffectUnused = function () {
  // Default Exports should count as used
  var src1 = [
    "var a = {",
    "  foo: 'foo',",
    "  bar: 'bar'",
    "};",
    "var x = 23;",
    "var z = 42;",
    "export default { a: a, x: x };",
    "export default function boo() { return x + z; }",
    "export default class MyClass { }"
  ];

  TestRun()
    .test(src1, {
      esnext: true,
      unused: true
    });

};

exports.testES6ModulesDefaultExportAssignmentExpr = function () {
  // The identifier in the exported AssignmentExpression should not be
  // interpreted as a declaration.
  var src = [
    "let x = 1;",
    "export default -x;"
  ];

  TestRun()
    .test(src, { unused: true, esnext: true });

};

exports.testES6ModulesNameSpaceImportsAffectUnused = function () {
  var src = [
    "import * as angular from 'angular';"
  ];

  TestRun()
    .addError(1, "'angular' is defined but never used.")
    .test(src, {
      esnext: true,
      unused: true
    });

};

exports.testES6TemplateLiterals = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/es6-template-literal.js", "utf8");
  var run = TestRun()
    .addError(14, "Octal literals are not allowed in strict mode.")
    .addError(21, "Unclosed template literal.");
  run.test(src, { esnext: true });
  run.test("/* jshint esnext: true */" + src);

};

exports.testES6TaggedTemplateLiterals = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/es6-template-literal-tagged.js", "utf8");
  TestRun()
    .addError(16, "Octal literals are not allowed in strict mode.")
    .addError(23, "Unclosed template literal.")
    .test(src, { esnext: true });
};

exports.testES6TemplateLiteralsUnused = function () {
  var src = [
    "var a = 'hello';",
    "alert(`${a} world`);"
  ];
  TestRun()
    .test(src, { esnext: true, unused: true });

};

exports.testES6TaggedTemplateLiteralsUnused = function () {
  var src = [
    "function tag() {}",
    "var a = 'hello';",
    "alert(tag`${a} world`);"
  ];
  TestRun()
    .test(src, { esnext: true, unused: true });

};


exports.testES6TemplateLiteralsUndef = function () {
  var src = [
    "/* global alert */",
    "alert(`${a} world`);"
  ];
  TestRun()
    .addError(2, "'a' is not defined.")
    .test(src, { esnext: true, undef: true });

};


exports.testES6TaggedTemplateLiteralsUndef = function () {
  var src = [
    "/* global alert */",
    "alert(tag`${a} world`);"
  ];
  TestRun()
    .addError(2, "'tag' is not defined.")
    .addError(2, "'a' is not defined.")
    .test(src, { esnext: true, undef: true });

};


exports.testES6TemplateLiteralMultiline = function () {
  var src = [
    'let multiline = `',
    'this string spans',
    'multiple lines',
    '`;'
  ];

  TestRun().test(src, { esnext: true });

};

exports.testES6TemplateLiteralsAreNotDirectives = function () {
  var src = [
    "function fn() {",
    "`use strict`;",
    "return \"\\077\";",
    "}"
  ];

  TestRun()
    .addError(2, "Expected an assignment or function call and instead saw an expression.")
    .test(src, { esnext: true });

  var src2 = [
    "function fn() {",
    "`${\"use strict\"}`;",
    "return \"\\077\";",
    "}"
  ];

  TestRun()
    .addError(2, "Expected an assignment or function call and instead saw an expression.")
    .test(src2, { esnext: true });

};

exports.testES6TemplateLiteralReturnValue = function () {
  var src = [
    'function sayHello(to) {',
    '  return `Hello, ${to}!`;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true });

  var src = [
    'function* sayHello(to) {',
    '  yield `Hello, ${to}!`;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true });

};

exports.testES6TemplateLiteralMultilineReturnValue = function () {
  var src = [
    'function sayHello(to) {',
    '  return `Hello, ',
    '    ${to}!`;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true });

  var src = [
    'function* sayHello(to) {',
    '  yield `Hello, ',
    '    ${to}!`;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true });

};


exports.testES6TaggedTemplateLiteralMultilineReturnValue = function () {
  var src = [
    'function tag() {}',
    'function sayHello(to) {',
    '  return tag`Hello, ',
    '    ${to}!`;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true });

  var src = [
    'function tag() {}',
    'function* sayHello(to) {',
    '  yield tag`Hello, ',
    '    ${to}!`;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true });

};


exports.testES6TemplateLiteralMultilineReturnValueWithFunctionCall = function () {
  var src = [
    'function sayHello() {',
    '  return `Helo',
    '      monkey`',
    '    .replace(\'l\', \'ll\');',
    '}',
    'print(sayHello());',
  ];

  TestRun().test(src, { esnext: true });

};


exports.testES6TaggedTemplateLiteralMultilineReturnValueWithFunctionCall = function () {
  var src = [
    'function tag() {}',
    'function sayHello() {',
    '  return tag`Helo',
    '    monkey!!`',
    '    .replace(\'l\', \'ll\');',
    '}',
    'print(sayHello());',
  ];

  TestRun().test(src, { esnext: true });

};


exports.testMultilineReturnValueStringLiteral = function () {
  var src = [
    'function sayHello(to) {',
    '  return "Hello, \\',
    '    " + to;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { multistr: true });

  var src = [
    'function* sayHello(to) {',
    '  yield "Hello, \\',
    '    " + to;',
    '}',
    'print(sayHello("George"));'
  ];

  TestRun().test(src, { esnext: true, multistr: true });

};

exports.testES6ExportStarFrom = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/es6-export-star-from.js", "utf8");
  TestRun()
    .addError(2, "Expected 'from' and instead saw 'foo'.")
    .addError(2, "Expected '(string)' and instead saw ';'.")
    .addError(2, "Missing semicolon.")
    .addError(3, "Expected '(string)' and instead saw '78'.")
    .test(src, { esnext: true });
};

exports.testPotentialVariableLeak = function () {
  var a = fs.readFileSync(__dirname + "/fixtures/leak.js", "utf8");
  var b = fs.readFileSync(__dirname + "/fixtures/gh1802.js", "utf8");

  // Real Error
  TestRun()
    .addError(2, "You might be leaking a variable (b) here.")
    .addError(3, "You might be leaking a variable (d) here.")
    .addError(4, "You might be leaking a variable (f) here.")
    .test(a, { esnext: true });

  // False Positive
  TestRun()
    .test(b);

};

exports.testDefaultArguments = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/default-arguments.js", "utf8");
  TestRun()
    .addError(14, "'bar' is not defined.")
    .addError(14, "'num3' was used before it was declared, which is illegal for 'param' variables.")
    .addError(15, "'num4' was used before it was declared, which is illegal for 'param' variables.")
    .addError(18, "Regular parameters should not come after default parameters.")
    .addError(27, "'c' is not defined.")
    .addError(33, "'d' was used before it was defined.")
    .addError(36, "'e' was used before it was declared, which is illegal for 'param' variables.")
    .test(src, { esnext: true, undef: true, latedef: true });

  TestRun()
    .addError(14, "'num3' was used before it was declared, which is illegal for 'param' variables.")
    .addError(15, "'num4' was used before it was declared, which is illegal for 'param' variables.")
    .addError(18, "Regular parameters should not come after default parameters.")
    .addError(36, "'e' was used before it was declared, which is illegal for 'param' variables.")
    .test(src, { moz: true });

  TestRun()
    .addError(7, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(11, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(12, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(13, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(14, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(14, "'num3' was used before it was declared, which is illegal for 'param' variables.")
    .addError(15, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(15, "'num4' was used before it was declared, which is illegal for 'param' variables.")
    .addError(18, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(18, "Regular parameters should not come after default parameters.")
    .addError(26, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(31, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(33, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(35, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(36, "'default parameters' is only available in ES6 (use 'esversion: 6').")
    .addError(36, "'e' was used before it was declared, which is illegal for 'param' variables.")
    .test(src, {  });

};

exports.testDuplicateParamNames = function () {
  var src = [
  "(function() {",
  "  (function(a, a) { // warns only with shadow",
  "  })();",
  "})();",
  "(function() {",
  "  'use strict';",
  "  (function(a, a) { // errors because of strict mode",
  "  })();",
  "})();",
  "(function() {",
  "  (function(a, a) { // errors because of strict mode",
  "  'use strict';",
  "  })();",
  "})();",
  "(function() {",
  "  'use strict';",
  "  (function(a, a) { // errors *once* because of strict mode",
  "  'use strict';",
  "  })();",
  "})();"
  ];

  TestRun()
    .addError(7, "'a' has already been declared.")
    .addError(11, "'a' has already been declared.")
    .addError(17, "'a' has already been declared.")
    .addError(18, "Unnecessary directive \"use strict\".")
    .test(src, { shadow: true });

  TestRun()
    .addError(2, "'a' is already defined.")
    .addError(7, "'a' has already been declared.")
    .addError(11, "'a' has already been declared.")
    .addError(17, "'a' has already been declared.")
    .addError(18, "Unnecessary directive \"use strict\".")
    .test(src, { shadow: "inner" });

  TestRun()
    .addError(2, "'a' is already defined.")
    .addError(7, "'a' has already been declared.")
    .addError(11, "'a' has already been declared.")
    .addError(17, "'a' has already been declared.")
    .addError(18, "Unnecessary directive \"use strict\".")
    .test(src, { shadow: "outer" });

  TestRun()
    .addError(2, "'a' is already defined.")
    .addError(7, "'a' has already been declared.")
    .addError(11, "'a' has already been declared.")
    .addError(17, "'a' has already been declared.")
    .addError(18, "Unnecessary directive \"use strict\".")
    .test(src, { shadow: false });

};

// Issue #1324: Make sure that we're not mutating passed options object.
exports.testClonePassedObjects = function () {
  var options = { predef: ["sup"] };
  JSHINT("", options);
  assert(options.predef.length == 1);
};

exports.testMagicProtoVariable = function () {
  JSHINT("__proto__ = 1;");
};

// Issue #1371: column number at end of non-strict comparison (for usability reasons)
exports.testColumnNumAfterNonStrictComparison = function () {
  var src =  "if (1 == 1) {\n" +
        "  var foo = 2;\n" +
        "  if (1 != 1){\n" +
        "    var bar = 3;\n" +
        "  }\n"+
        "}";
  TestRun()
    .addError(1, "Expected '===' and instead saw '=='.", {character: 9})
    .addError(3, "Expected '!==' and instead saw '!='.", {character: 11})
    .test(src, {eqeqeq: true});
};


exports.testArrayPrototypeExtensions = function () {
  Array.prototype.undefinedPrototypeProperty = undefined;

  JSHINT("var x = 123;\nlet y = 456;\nconst z = 123;");
  delete Array.prototype.undefinedPrototypeProperty;
};

// Issue #1446, PR #1688
exports.testIncorrectJsonDetection = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/mappingstart.js", "utf8");
  // Without the bug fix, a JSON lint error will be raised because the parser
  // thinks it is rendering JSON instead of JavaScript.
  TestRun().test(src);
};

exports.testEscapedReservedWords = function () {
  var code = [
    'var v\u0061r = 42;',
    'alert(va\u0072);'
  ];

  TestRun()
    .addError(1, "Expected an identifier and instead saw 'var' (a reserved word).")
    .addError(2, "Expected an identifier and instead saw 'var'.")
    .test(code);

};

exports.testUnnamedFuncStatement = function () {
  TestRun()
    .addError(1, "Missing name in function declaration.")
    .test("function() {}");

};

// GH-1976 "Fixed set property 'type' of undefined in `if` blockstmt"
exports.testUnCleanedForinifcheckneeded = function () {
  var forinCode = [
    "for (var key in a) {",
    "  console.log(key);",
    "}"
  ];

  var ifCode = [
    "if(true) {",
    "}"
  ];

  try {
    JSHINT(forinCode, { maxerr: 1, forin: true });
    // Prior to the fix, if the final `forin` check reached the `maxerr` limit,
    // the internal `state.forinifcheckneeded` maintained its previous value
    // and triggered an error in subsequent invocations of JSHint.
    JSHINT(ifCode, { maxerr: 1, forin: true });
  } catch(e) {
    assert(false, "Exception was thrown");
  }

};

// gh-738 "eval" as an object key should not cause `W061` warnngs
exports.testPermitEvalAsKey = function () {
  var srcNode = fs.readFileSync(__dirname + "/fixtures/gh-738-node.js", "utf8");
  var srcBrowser = fs.readFileSync(__dirname + "/fixtures/gh-738-browser.js", "utf8");
  // global calls to eval should still cause warning.
  // test a mixture of permitted and disallowed calls
  // `global#eval` in `node:true` should still cause warning
  // `(document|window)#eval` in `browser:true` should still cause warning

  // browser globals
  TestRun()
  .addError(17, "eval can be harmful.")
  .addError(19, "eval can be harmful.")
  .addError(20, "eval can be harmful.")
  .addError(22, "eval can be harmful.")
  .addError(23, "eval can be harmful.")
  .addError(25, "eval can be harmful.")
  .test(srcBrowser, { browser: true });

  // node globals
  TestRun()
  .addError(18, "eval can be harmful.")
  .addError(19, "eval can be harmful.")
  .addError(20, "eval can be harmful.")
  .addError(22, "eval can be harmful.")
  .test(srcNode, { node: true });


};

// gh-2194 jshint confusing arrays at beginning of file with JSON
exports.beginningArraysAreNotJSON = function () {
  var src = fs.readFileSync(__dirname + "/fixtures/gh-2194.js", "utf8");

  TestRun()
  .test(src);


};

exports.labelsOutOfScope = function () {
  var src = [
    "function a() {",
    "  if (true) {",
    "    bar: switch(2) {",
    "    }",
    "    foo: switch(1) {",
    "      case 1:",
    "        (function () {",
    "          baz: switch(3) {",
    "            case 3:",
    "              break foo;",
    "            case 2:",
    "              break bar;",
    "            case 3:",
    "              break doesnotexist;",
    "          }",
    "        })();",
    "        if (true) {",
    "          break foo;",
    "        }",
    "        break foo;",
    "      case 2:",
    "        break bar;",
    "      case 3:",
    "        break baz;",
    "    }",
    "  }",
    "}"
  ];

  TestRun()
    .addError(10, "'foo' is not a statement label.")
    .addError(12, "'bar' is not a statement label.")
    .addError(14, "'doesnotexist' is not a statement label.")
    .addError(22, "'bar' is not a statement label.")
    .addError(24, "'baz' is not a statement label.")
    .test(src);

};

exports.labelThroughCatch = function () {
  var src = [
    "function labelExample() {",
    "  'use strict';",
    "  var i;",
    "  example:",
    "    for (i = 0; i < 10; i += 1) {",
    "      try {",
    "        if (i === 5) {",
    "          break example;",
    "        } else {",
    "          throw new Error();",
    "        }",
    "      } catch (e) {",
    "        continue example;",
    "      }",
    "    }",
    "}"
  ];

  TestRun()
    .test(src);

};

exports.labelDoesNotExistInGlobalScope = function () {
  var src = [
    "switch(1) {",
    "  case 1:",
    "    break nonExistent;",
    "}"
  ];

  TestRun()
    .addError(3, "'nonExistent' is not a statement label.")
    .test(src);

};

exports.labeledBreakWithoutLoop = function () {
  var src = [
    "foo: {",
    "  break foo;",
    "}"
  ];

  TestRun()
    .test(src);

};

// ECMAScript 5.1 § 12.7: labeled continue must refer to an enclosing
// IterationStatement, as opposed to labeled break which is only required to
// refer to an enclosing Statement.
exports.labeledContinueWithoutLoop = function () {
  var src = [
    "foo: switch (i) {",
    "  case 1:",
    "    continue foo;",
    "}"
  ];

  TestRun()
    .addError(3, "Unexpected 'continue'.")
    .test(src);

};

exports.unlabeledBreakWithoutLoop = function() {
  var src = [
    "if (1 == 1) {",
    "  break;",
    "}",
  ];

  TestRun()
    .addError(2, "Unexpected 'break'.")
    .test(src);

}

exports.unlabeledContinueWithoutLoop = function() {
  var src = [
    "switch (i) {",
    "  case 1:",
    "    continue;", // breakage but not loopage
    "}",
    "continue;"
  ];

  TestRun()
    .addError(3, "Unexpected 'continue'.")
    .addError(5, "Unexpected 'continue'.")
    .test(src);

}

exports.labelsContinue = function () {
  var src = [
    "exists: while(true) {",
    "  if (false) {",
    "    continue exists;",
    "  }",
    "  continue nonExistent;",
    "}"
  ];

  TestRun()
    .addError(5, "'nonExistent' is not a statement label.")
    .test(src);

};

exports.catchWithNoParam = function () {
  var src = [
    "try{}catch(){}"
  ];

  TestRun()
    .addError(1, "Expected an identifier and instead saw ')'.")
    .test(src);

};

exports.tryWithoutCatch = function () {
  var src = [
    "try{}",
    "if (true) { console.log(); }"
  ];

  TestRun()
    .addError(2, "Expected 'catch' and instead saw 'if'.")
    .test(src);

  var src = [
    "try{}"
  ];

  TestRun()
    .addError(1, "Expected 'catch' and instead saw ''.")
    .test(src);

};

exports["gh-1920"] = function () {
  var src = [
    "for (var key in objects) {",
    "  if (!objects.hasOwnProperty(key)) {",
    "    switch (key) {",
    "    }",
    "  }",
    "}"
  ];

  TestRun()
    .addError(1, "The body of a for in should be wrapped in an if statement to filter unwanted properties from the prototype.")
    .test(src, { forin: true });

};

exports.duplicateProto = function () {
  var src = [
    "(function() {",
    "  var __proto__;",
    "  var __proto__;",
    "}());"
  ];

  // TODO: Enable this expected warning in the next major release
  TestRun( "Duplicate `var`s")
    //.addError(3, "'__proto__' is already defined.")
    .test(src, { proto: true });

  src = [
    "(function() {",
    "  let __proto__;",
    "  let __proto__;",
    "}());"
  ];

  TestRun( "Duplicate `let`s")
    .addError(3, "'__proto__' has already been declared.")
    .test(src, { proto: true, esnext: true });

  src = [
    "(function() {",
    "  const __proto__ = null;",
    "  const __proto__ = null;",
    "}());"
  ];

  TestRun( "Duplicate `const`s")
    .addError(3, "'__proto__' has already been declared.")
    .test(src, { proto: true, esnext: true });

  src = [
    "void {",
    "  __proto__: null,",
    "  __proto__: null",
    "};"
  ];

  // TODO: Enable this expected warning in the next major release
  TestRun( "Duplicate keys (data)")
    //.addError(3, "Duplicate key '__proto__'.")
    .test(src, { proto: true });

  src = [
    "void {",
    "  __proto__: null,",
    "  get __proto__() {}",
    "};"
  ];

  // TODO: Enable this expected warning in the next major release
  TestRun( "Duplicate keys (data and accessor)")
    //.addError(3, "Duplicate key '__proto__'.")
    .test(src, { proto: true });

  src = [
    "__proto__: while (true) {",
    "  __proto__: while (true) {",
    "    break;",
    "  }",
    "}"
  ];

  TestRun( "Duplicate labels")
    .addError(2, "'__proto__' has already been declared.")
    .test(src, { proto: true });

};

exports["gh-2761"] = function () {
  var code = [
    "/* global foo: false */",
    "foo = 2;",
    "// jshint -W020",
    "foo = 3;",
    "// jshint +W020",
    "foo = 4;"
  ];

  TestRun( "W020")
    .addError(2, "Read only.")
    .addError(6, "Read only.")
    .test(code);

  code = [
    "function a() {}",
    "a = 2;",
    "// jshint -W021",
    "a = 3;",
    "// jshint +W021",
    "a = 4;"
  ];

  TestRun( "W021")
    .addError(2, "Reassignment of 'a', which is is a function. " +
              "Use 'var' or 'let' to declare bindings that may change.")
    .addError(6, "Reassignment of 'a', which is is a function. " +
              "Use 'var' or 'let' to declare bindings that may change.")
    .test(code);

};

exports["gh-2838"] = function () {

  var code = [
    "function foo() {",
    "  return a + b;",
    "}",
    "function bar() {",
    "  return a + b;",
    "}",
    "let a = 1;",
    "const b = 2;"
  ];

  TestRun().test(code, { esversion: 6 });

  code = [
    "function x() {",
    "  return c;",
    "}",
    "void c;",
    "let c;"
  ];

  TestRun( "Same-scope reference following sub-scope reference")
    .addError(5, "'c' was used before it was declared, which is illegal for 'let' variables.")
    .test(code, { esversion: 6 });

  code = [
    "function x() {",
    "  return d;",
    "}",
    "({ d } = {});",
    "let d;"
  ];

  TestRun( "Same-scope assignment following sub-scope reference")
    .addError(5, "'d' was used before it was declared, which is illegal for 'let' variables.")
    .test(code, { esversion: 6 });

};
