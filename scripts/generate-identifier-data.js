// Based on https://gist.github.com/mathiasbynens/6334847 by @mathias

'use strict';

var regenerate = require('regenerate');

// Which Unicode version should be used?
var pkg = require('../package.json');
var dependencies = Object.keys(pkg.devDependencies);
var unicodeVersion = dependencies.find((name) => /^unicode-\d/.test(name));

// Shorthand function
var get = function(what) {
  return require(unicodeVersion + '/' + what + '/code-points.js');
};

// Get the Unicode properties needed to construct the ES6 regex.
var ID_Start = get('Binary_Property/ID_Start');
var ID_Continue = get('Binary_Property/ID_Continue');
var Other_ID_Start = get('Binary_Property/Other_ID_Start');

var generateData = function() { // ES 5.1
  // http://mathiasbynens.be/notes/javascript-identifiers#valid-identifier-names
  var identifierStart = regenerate(ID_Start)
    .add('$', '_')
    // remove astral symbols (JSHint-specific; lex.js needs updating)
    .removeRange(0x010000, 0x10FFFF)
    .removeRange(0x0, 0x7F); // remove ASCII symbols (JSHint-specific)
  var identifierPart = regenerate(ID_Continue)
    .add('$', '_', '\u200C', '\u200D')
    // remove ASCII symbols (JSHint-specific)
    .removeRange(0x0, 0x7F)
    // remove astral symbols (JSHint-specific; lex.js needs updating)
    .removeRange(0x010000, 0x10FFFF)
    // just to make sure no `IdentifierStart` code points are repeated here
    .remove(identifierStart);
  return {
    'nonAsciiIdentifierStart': identifierStart.toArray(),
    'nonAsciiIdentifierPart': identifierPart.toArray()
  };
};

var fs = require('fs');
var writeFile = function(fileName, data) {
  fs.writeFileSync(
    fileName,
    [
    'var str = \'' + data.join(',') + '\';',
    'var arr = str.split(\',\').map(function(code) {',
    '  return parseInt(code, 10);',
    '});',
    'module.exports = arr;'
    ].join('\n')
  );
};

var result = generateData();
writeFile('./data/non-ascii-identifier-start.js', result.nonAsciiIdentifierStart);
writeFile('./data/non-ascii-identifier-part-only.js', result.nonAsciiIdentifierPart);
