"use strict";

function Token(options) {
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }
}

module.exports = Token;
