"use strict";

function Token(options) {
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }
}

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
