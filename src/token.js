"use strict";
var _ = require("lodash");

var natives = [
  "Array", "ArrayBuffer", "Boolean", "Collator", "DataView", "Date",
  "DateTimeFormat", "Error", "EvalError", "Float32Array", "Float64Array",
  "Function", "Infinity", "Intl", "Int16Array", "Int32Array", "Int8Array",
  "Iterator", "Number", "NumberFormat", "Object", "RangeError",
  "ReferenceError", "RegExp", "StopIteration", "String", "SyntaxError",
  "TypeError", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray",
  "URIError"
];

function walkPrototype(obj) {
  if (typeof obj !== "object") {
    return;
  }

  return obj.right === "prototype" ? obj : walkPrototype(obj.left);
}

function walkNative(obj) {
  while (!obj.identifier && typeof obj.left === "object") {
    obj = obj.left;
  }

  if (obj.identifier && natives.indexOf(obj.value) >= 0) {
    return obj.value;
  }
}

function Token(options) {
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }
}

/**
 * Test whether a given token is a punctuator matching one of the specified
 * values
 *
 * @param {Token} token
 * @param {Array.<string>} values
 *
 * @returns {boolean}
 */
Token.prototype.checkPunctuators = function(values) {
  if (this.type === "(punctuator)") {
    return _.contains(values, this.value);
  }

  return false;
};

/**
 * Test whether a given token is a punctuator matching the specified value
 *
 * @param {Token} token
 * @param {string} value
 *
 * @returns {boolean}
 */
Token.prototype.checkPunctuator = function(value) {
  return this.type === "(punctuator)" && this.value === value;
};

Token.prototype.findNativePrototype = function(left) {
  var prototype = walkPrototype(this);

  if (prototype) {
    return walkNative(prototype);
  }
};

Token.prototype.isBeginOfExpr = function() {
  return !this.left && this.arity !== "unary";
};

Token.prototype.isGlobalEval = function(state) {
  var isGlobal = false;

  // permit methods to refer to an "eval" key in their own context
  if (this.type === "this" && state.funct["(context)"] === null) {
    isGlobal = true;
  }
  // permit use of "eval" members of objects
  else if (this.type === "(identifier)") {
    if (state.option.node && this.value === "global") {
      isGlobal = true;
    }

    else if (state.option.browser && (this.value === "window" || this.value === "document")) {
      isGlobal = true;
    }
  }

  return isGlobal;
};

Token.prototype.isInfix = function(token) {
  return this.infix || (!this.identifier && !this.template && !!this.led);
};

Token.prototype.isPoorRelation = function(eqnull) {
  return (this.type === "(number)" && +this.value === 0) ||
    (this.type === "(string)" && this.value === "") ||
    (this.type === "null" && !eqnull) ||
    this.type === "true" ||
    this.type === "false" ||
    this.type === "undefined";
};

Token.prototype.isPropertyName = function() {
  return this.identifier || this.id === "(string)" || this.id === "(number)";
};

Token.prototype.firstLine = function() {
  return this.startLine || this.line;
};

Token.extend = function(protoProps) {
  var Parent = this;
  var Child = function() { Token.apply(this, arguments); };
  var staticProps = Object.keys(Parent);
  var prop;

  Child.prototype = Object.create(Parent.prototype);

  for (prop in staticProps) {
    Child[prop] = Parent[prop];
  }

  for (prop in protoProps) {
    Child.prototype[prop] = protoProps[prop];
  }

  return Child;
};

module.exports = Token;
