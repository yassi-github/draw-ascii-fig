module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "overrides": [
    {
      "env": {
        "node": true
      },
      "files": [
        ".eslintrc.{js,cjs}"
      ],
      "parserOptions": {
        "sourceType": "script"
      }
    }
  ],
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ],
    "newline-after-var": ["error", "always"],
    "eol-last": ["error", "always"],
    "no-multiple-empty-lines": [
      "error",
      {
        max: 1,
        maxEOF: 1,
        maxBOF: 0
      }
    ],
    "no-use-before-define": [
      "error", { functions: true, variables: true }
    ],
  },
};
