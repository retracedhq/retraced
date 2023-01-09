exports.command = "copy";
exports.describe = "copy data from one database to another";
exports.builder = (yargs) => {
  return yargs.commandDir("copy");
};
