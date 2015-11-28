"use strict";

function Token(options) {
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }

  // Array creation is deferred until required as a performance optimization
  this.ignored = null;
}

Token.prototype.ignore = function(id) {
  if (!this.ignored) {
    this.ignored = [];
  }
  if (this.ignored.indexOf(id) === -1) {
    this.ignored.push(id);
  }
};

module.exports = Token;
