"use strict";
[
  "Identifier",
  "PrimaryExpression",
  "Literal",
  "MemberExpression",
  "NewExpression",
  "CallExpression",
  "LeftHandSideExpression",
  "UpdateExpression",
  "UnaryExpression",
  "ExponentiationExpression",
  "MultiplicativeExpression",
  "AdditiveExpression",
  "ShiftExpression",
  "RelationalExpression",
  "EqualityExpression",
  "BitwiseANDExpression",
  "BitwiseXORExpression",
  "BitwiseORExpression",
  "LogicalANDExpression",
  "LogicalORExpression",
  "ConditionalExpression",
  "AssignmentExpression",
  "Expression"
].reverse().forEach(function(name, idx) {
  exports[name] = idx + 1;
});
