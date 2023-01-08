module.exports = {
  require: [
    "ts-node/register",
    "source-map-support/register",
    "mocha-jenkins-reporter",
  ],
  colors: true,
  exit: true,
  spec: ["src/test/**/*.ts", "src/**/*_test.ts"],
};
