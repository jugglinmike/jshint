"use strict";

function list(items, title) {
  if (items.length === 0) {
    return null;
  }

  return [
    title.replace("#", items.length),
    items.map(function(item) { return "- " + item; }).join("\n")
  ].join("\n");
}

module.exports = function report(summary) {
  var total = summary.results.length;
  var seconds = (summary.duration / 1000).toFixed(2);
  var expected = {
    success: 0,
    failure: 0,
    typeI: 0,
    typeII: 0
  };
  var unexpected = {
    success: [],
    failure: [],
    typeI: [],
    typeII: []
  };

  summary.results.forEach(function(result) {
    var allowed = summary.allowed[result.name];
    delete summary.allowed[result.name];

    if (!!result.parseFailure === result.expected) {
      if (allowed) {
        if (result.parseFailure) {
          unexpected.failure.push(result.name);
        } else {
          unexpected.success.push(result.name);
        }
      } else {
        if (result.parseFailure) {
          expected.failure++;
        } else {
          expected.success++;
        }
      }
    } else {
      if (allowed) {
        if (result.parseFailure) {
          expected.typeI++;
        } else {
          expected.typeII++;
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

  var lines = [
    "Results:",
    "",
    total + " total programs parsed in " + seconds + " seconds.",
    "",
    expected.success + " valid programs parsed successfully",
    expected.failure + " invalid programs produced parsing errors",
    expected.typeI + " invalid programs parsed successfully (in accordance with expectations file)",
    expected.typeII + " valid programs produced parsing errors (in accordance with expectations file)",
    "",
    list(unexpected.success, "# valid programs parsed successfully (in violation of expectations file):"),
    list(unexpected.failure, "# invalid programs produced parsing errors (in violation of expectations file):"),
    list(unexpected.typeI, "# invalid programs parsed successfully (without a corresponding entry in expectations file):"),
    list(unexpected.typeII, "# valid programs produced parsing errors (without a corresponding entry in expectations file):"),
    list(Object.keys(summary.allowed), "# programs were referenced by the expectations file but not parsed in this test run:"),
  ];

  return lines
    .filter(function(line) {
      return typeof line === "string";
    })
    .join("\n");
};
