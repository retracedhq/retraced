import "source-map-support/register";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import _ from "lodash";

exports.command = "new";
exports.desc = "creates a new migration file";

exports.builder = {
  name: {
    alias: "n",
    demand: true,
  },
  db: {
    alias: "d",
    choices: ["pg", "pg10", "es"],
    demand: true,
  },
};

const esTemplate = `
module.exports = () => {
  return {
    op: '',
    params: {
    },
  };
};
`;

exports.handler = (argv) => {
  const name = argv.name.replace(" ", "-");
  const timestamp = (new Date().getTime() / 1000).toFixed();

  if (argv.db === "pg" || argv.db === "pg10" ) {
    _.forEach(["do", "undo"], (action) => {
      const dest = path.join("migrations", argv.db, `${timestamp}.${action}.${name}.sql`);
      fs.writeFileSync(dest, "-- SQL goes here");
      console.log(chalk.green(dest));
    });
  } else if (argv.db === "es") {
    const dest = path.join("migrations", argv.db, `${timestamp}-${name}.js`);
    fs.writeFileSync(dest, esTemplate);
    console.log(chalk.green(dest));
  }
};
