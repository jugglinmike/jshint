"use strict";

var TestRun = require("../../helpers/testhelper").setup.testRun;

exports.enabling = function (test) {
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
      "    yield function.sent;",
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
    .addError(1, "'function.sent' expressions may only occur within generator functions.")
    .test("void function.sent;", { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within a block body (nested in global code)")
    .addError(2, "'function.sent' expressions may only occur within generator functions.")
    .test([
      "{",
      "  void function.sent;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test, "Within a function body")
    .addError(2, "'function.sent' expressions may only occur within generator functions.")
    .test([
      "function f() {",
      "  return function.sent;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  TestRun(test)
    .addError(3, "'function.sent' expressions may only occur within generator functions.")
    .test([
      "function *g() {",
      "  var x = () => {",
      "    return function.sent;",
      "  };",
      "  yield x;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  test.done();
};

exports.usage = function (test) {
  TestRun(test)
    .test([
      "function* g() {",
      "  var x;",
      "  x = function.sent;",
      "  x = function.sent + 1;",
      "  x = false ^ function.sent;",
      "  x = !function.sent;",
      "  x = function.sent ? 0 : 1;",
      "  x = function.sent.prop;",
      "  x = function.sent['-prop'];",
      "  x = function.sent();",
      "  x = function.sent`123`;",
      "  x = function.sent();",
      "  x = function.sent.call(null);",
      "  yield x;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  test.done();
};

exports.modification = function (test) {
  TestRun(test)
    .addError(2, "Bad operand.")
    .addError(3, "Bad assignment.")
    .test([
      "function* g() {",
      "  ++function.sent;",
      "  var x = function.sent -= 1;",
      "  yield null;",
      "}"
    ], { esversion: 6, unstable: { gensent: true } });

  test.done();
};
