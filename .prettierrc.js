module.exports = {
  bracketSpacing: true,
  bracketSameLine: true,
  trailingComma: "es5",
  semi: true,
  printWidth: 110,
  arrowParens: "always",
  overrides: [
    {
      files: ["tsconfig.json", "jsconfig.json"],
      options: {
        parser: "jsonc",
      },
    },
  ],
};
