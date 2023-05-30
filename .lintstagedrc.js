// https://nextjs.org/docs/basic-features/eslint#lint-staged

const path = require("path");

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

module.exports = {
  "*.{js,mjs,jsx,ts,tsx}": [buildEslintCommand],
  "*.{js,mjs,ts,tsx,css,md,json,yml,yaml,json}": "prettier --write",
  "graphql/**/*.graphql": "prettier --write",
};
