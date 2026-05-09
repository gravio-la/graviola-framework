/**
 * Opt-in strict ruleset for Graviola packages.
 * Extend with: `"extends": ["eslint-config-edb/strict"]`
 *
 * Baseline stays in `./index.js`; this file adds policy-only rules (types, function style, classes).
 */
module.exports = {
  extends: [require.resolve("./index.js")],
  plugins: ["@typescript-eslint"],
  rules: {
    /** Prefer `type` over `interface` */
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],

    /** Named arrow / function expressions assigned to `const`; no `function foo() {}` declarations */
    "func-style": ["error", "expression", { allowArrowFunctions: true }],
    "prefer-arrow-callback": ["error", { allowNamedFunctions: false }],

    /**
     * No classes except typed errors extending `Error` (built-ins or custom `extends Error`).
     * Refine selectors if legitimate patterns are blocked.
     */
    "no-restricted-syntax": [
      "error",
      {
        selector: "ClassDeclaration[superClass=null]",
        message:
          "Avoid classes; use factory functions and plain data. Exception: `class X extends Error` for boundary errors.",
      },
      {
        selector:
          "ClassDeclaration[superClass.type='Identifier'][superClass.name!='Error'][superClass.name!='TypeError'][superClass.name!='SyntaxError'][superClass.name!='ReferenceError'][superClass.name!='RangeError'][superClass.name!='EvalError'][superClass.name!='URIError'][superClass.name!='AggregateError']",
        message:
          "Only `class … extends Error` (or built-in Error subclasses) is allowed for typed errors.",
      },
      {
        selector: "ClassExpression",
        message:
          "Avoid class expressions; use factory functions and plain data.",
      },
    ],
  },
};
