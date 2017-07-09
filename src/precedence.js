"use strict";
[
  "DELIM",
  "Expression", // 0
  "AssignmentExpression", // 10
  "ConditionalExpression",
  "LogicalORExpression", // 40
  "LogicalANDExpression", // 50
  "BitwiseORExpression", // 70
  "BitwiseXORExpression", // 80
  "BitwiseANDExpression", // 90
  "EqualityExpression",
  "RelationalExpression",
  "ShiftExpression", // 100
  "AdditiveExpression", // 130
  "MultiplicativeExpression", // 140
  "ExponentiationExpression",
  "UnaryExpression", // 150
  "UpdateExpression",
  "LeftHandSideExpression",
  "CallExpression", // 155
  "NewExpression",
  "MemberExpression", // 160
  "Literal",
  "PrimaryExpression" // 155
].forEach(function(name, idx) {
  exports[name] = idx;
});
