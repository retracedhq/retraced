import "source-map-support/register";
import * as chalk from "chalk";
import * as path from "path";
import * as _ from "lodash";
import * as postgrator from "postgrator/postgrator";
import * as bugsnag from "bugsnag";
import { setupBugsnag } from "../../common";

setupBugsnag();

import getPgPool from "../../persistence/pg";
import { logger } from "../../../logger";

getPgPool();

export const command = "pg";
export const describe = "migrate postgres database to the current schema";

export const builder = {
  postgresHost: {
    demand: true,
  },
  postgresPort: {
    demand: true,
  },
  postgresDatabase: {
    demand: true,
  },
  postgresUser: {
    demand: true,
  },
  postgresPassword: {
    demand: true,
  },
  schemaPath: {
    default: path.join(__dirname, "../../../../migrations/pg"),
  },
};

logger.info("registering handler");
export const handler = (argv) => {
  logger.child({up: "pg", schemaPath: argv.schemaPath}).info("beginning handler");
  const cs = `tcp://${argv.postgresUser}:${argv.postgresPassword}@${argv.postgresHost}:${argv.postgresPort}/${argv.postgresDatabase}`;
  logger.info("initializing migrator");
  postgrator.setConfig({
    migrationDirectory: argv.schemaPath,
    driver: "pg",
    connectionString: cs,
  });

  logger.info("executing migration");
  postgrator.migrate("max", (err, migrations) => {
    if (err) {
      bugsnag.notify(err);
      console.log(chalk.red(err));
      process.exit(1);
    }

    _.forEach(migrations, (m) => {
      console.log(chalk.green(m.name));
    });
    process.exit(0);
  });
};
