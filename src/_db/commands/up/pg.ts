import "source-map-support/register";
import * as chalk from "chalk";
import * as _ from "lodash";
import Postgrator from "postgrator";
import getPgPool from "../../persistence/pg";
import * as bugsnag from "bugsnag";
import { setupBugsnag } from "../../common";

setupBugsnag();

import { logger } from "../../../logger";

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
    default: "/src/migrations/pg",
  },
};

logger.info("registering handler");
export const handler = (argv) => {
  logger.child({up: "pg", schemaPath: argv.schemaPath}).info("beginning handler");
  // const cs = `tcp://${argv.postgresUser}:${argv.postgresPassword}@${argv.postgresHost}:${argv.postgresPort}/${argv.postgresDatabase}`;
  logger.info("initializing migrator for");
  // console.log("++++++cs:", cs);

  const pgPool = getPgPool();
  const postgrator = new Postgrator({
    migrationPattern: argv.schemaPath,
    driver: "pg",
    execQuery: (query) => pgPool.query(query),
  });

  postgrator.on("validation-started", (migration) => console.log("validation started", migration));
  postgrator.on("validation-finished", (migration) => console.log("validation finished", migration));
  postgrator.on("migration-started", (migration) => console.log("migration started", migration));
  postgrator.on("migration-finished", (migration) => console.log("migration finished", migration));

  logger.info("executing migrations");
  postgrator.migrate("max")
    .then((migrations) => {
      _.forEach(migrations, (m) => {
        console.log(chalk.green(m.name));
      });
      process.exit(0);
    })
    .catch((err) => {
      bugsnag.notify(err);
      console.log(chalk.red(err));
      process.exit(1);
    });
};
