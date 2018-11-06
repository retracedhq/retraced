import "source-map-support/register";

exports.command = "reindex <command>";
exports.describe = "reindex events from an event database into elasticsearch";
exports.builder = (yargs) => {
  return yargs.commandDir("reindex");
};
