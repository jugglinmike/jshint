"use strict";

module.exports = function report(results, allowed) {
  var expected = {
    success: [],
    failure: [],
    typeI: [],
    typeII: []
  };
  var unexpected = {
    success: [],
    failure: [],
    typeI: [],
    typeII: [],
    unrecognized: null
  };
  var totalUnexpected;

  results.forEach(function(result) {
    var isAllowed = allowed[result.name];
    delete allowed[result.name];

    if (!!result.parseFailure === result.expected) {
      if (isAllowed) {
        if (result.parseFailure) {
          unexpected.failure.push(result.name);
        } else {
          unexpected.success.push(result.name);
        }
      } else {
        if (result.parseFailure) {
          expected.failure.push(result.name);
        } else {
          expected.success.push(result.name);
        }
      }
    } else {
      if (isAllowed) {
        if (result.parseFailure) {
          expected.typeI.push(result.name);
        } else {
          expected.typeII.push(result.name);
        }
      } else {
        if (result.parseFailure) {
          unexpected.typeII.push(result.name);
        } else {
          unexpected.typeI.push(result.name);
        }
      }
    }
  });
  unexpected.unrecognized = Object.keys(allowed);
  totalUnexpected = unexpected.success.length + unexpected.failure.length +
    unexpected.typeI.length + unexpected.typeII.length +
    unexpected.unrecognized.length;

  return {
    totalTests: results.length,
    totalUnexpected: totalUnexpected,
    expected: expected,
    unexpected: unexpected
  };
};
