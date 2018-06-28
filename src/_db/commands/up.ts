import "source-map-support/register";

exports.command = "up";
exports.describe = "migrate a database to the current schema";
exports.builder = (yargs) => {
  return yargs.commandDir("up");
};
