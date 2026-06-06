/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ["out/", "node_modules/", "dist/", "**/*.js", "**/*.mjs", "**/*.cjs"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-require-imports": "off",
    "no-empty": "off",
    "prefer-const": "off",
    "no-extra-semi": "off",
    "no-control-regex": "off",
    "no-async-promise-executor": "off",
  },
};
