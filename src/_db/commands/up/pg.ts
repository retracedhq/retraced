import "source-map-support/register";
import * as chalk from "chalk";
import * as _ from "lodash";
import * as Postgrator from "postgrator";
import * as bugsnag from "bugsnag";
import { setupBugsnag } from "../../common";

setupBugsnag();

import { logger } from "../../../logger";
import { Client } from "pg";

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
export const handler = async (argv) => {
  logger.child({up: "pg", schemaPath: argv.schemaPath}).info("beginning handler");

  const client = new Client({
    host: argv.postgresHost,
    port: parseInt(argv.postgresPort, 10),
    database: argv.postgresDatabase,
    user: argv.postgresUser,
    password: argv.postgresPassword,
  });

  try {
    logger.info("connecting to database");
    await client.connect();

    logger.info("initializing migrator");
    const postgrator = new Postgrator({
      migrationPattern: `${argv.schemaPath}/*`,
      driver: "pg",
      database: argv.postgresDatabase,
      execQuery: (query) => client.query(query),
    } as any);

    logger.info("executing migration");
    const migrations = await postgrator.migrate();

    _.forEach(migrations, (m) => {
      console.log(chalk.green(m.name));
    });

    await client.end();
    process.exit(0);
  } catch (err) {
    bugsnag.notify(err);
    console.log(chalk.red(err));
    await client.end().catch(() => {});
    process.exit(1);
  }
};
