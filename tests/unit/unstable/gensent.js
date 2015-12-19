"use strict";

var TestRun = require("../../helpers/testhelper").setup.testRun;

exports.enabling = function (test) {
  //TestRun(test)
  //  .addError("The 'gensent' option is only available when linting ECMAScript 6 code.")
  //  .test('', { unstable: { gensent: true } });
  var code = [
    "function* g() {",
    "  yield function.sent;",
    "}"
  ];

  TestRun(test, "Not enabled")
    .addError(2, "'function.sent' is a non-standard language feature. Enable it using the 'gensent' unstable option.")
    .test(code, { esversion: 6 });

  test.done();
};

exports.context = function (test) {
  TestRun(test, "Within a generator function body")
    .test([
      "function* g() {",
      "  yield function.sent;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within a block body (nested in a generator body)")
    .test([
      "function* g() {",
      "  {",
      "    yield function.sent + x + function.sent;",
      "  }",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within a generator method body")
    .test([
      "var obj = {",
      "  *g() {",
      "    yield function.sent;",
      "  }",
      "};"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within global code")
    .addError(1, "A function.sent expression shall be within a generator function (with syntax: `function*`)")
    .test("void function.sent;", { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within a block body (nested in global code)")
    .addError(2, "A function.sent expression shall be within a generator function (with syntax: `function*`)")
    .test([
      "{",
      "  void function.sent;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within a function body")
    .addError(2, "A function.sent expression shall be within a generator function (with syntax: `function*`)")
    .addError(3, "A function.sent expression shall be within a generator function (with syntax: `function*`)")
    .test([
      "function f() {",
      "  var x = function.sent;",
      "  return function.sent + x + function.sent;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test)
    .addError(3, "A function.sent expression shall be within a generator function (with syntax: `function*`)")
    .addError(4, "A function.sent expression shall be within a generator function (with syntax: `function*`)")
    .test([
      "function *g() {",
      "  yield () => {",
      "    var x = function.sent;",
      "    return function.sent + x + function.sent;",
      "  };",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  test.done();
};
