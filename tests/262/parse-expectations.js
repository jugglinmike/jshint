'use strict';

module.exports = function(src) {
  return src.split('\n').reduce(function(memo, line) {
    var parts;
    line = line.replace(/\s*#.*$/, '').trim();
    if (!line) {
      return memo;
    }
    memo[line] = true;

    return memo;
  }, Object.create(null));
};
