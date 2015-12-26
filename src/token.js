"use strict";

function Token(options) {
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }
}

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
