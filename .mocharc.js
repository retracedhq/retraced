module.exports = {
  require: ["ts-node/register", "mocha-jenkins-reporter"],
  colors: true,
  exit: true,
  spec: ["src/test/**/*.ts", "src/**/*_test.ts"],
};
