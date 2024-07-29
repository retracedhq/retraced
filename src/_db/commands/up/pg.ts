import picocolors from "picocolors";
import path from "path";
import _ from "lodash";
import pg from "pg";

import { logger } from "../../../logger";
import { notifyError, startErrorNotifier } from "../../../error-notifier";

startErrorNotifier();

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
    default: path.join(__dirname, "../../../../migrations/pg/*"),
  },
};

logger.info("registering handler");
export const handler = async (argv) => {
  try {
    const postgrator = (await import("postgrator")).default;
    logger.child({ up: "pg", schemaPath: argv.schemaPath }).info("beginning handler");
    const cs = `tcp://${argv.postgresUser}:${argv.postgresPassword}@${argv.postgresHost}:${
      argv.postgresPort
    }/${argv.postgresDatabase}${argv.postgresSsl ? "?sslmode=require" : ""}`;
    const client = new pg.Client(cs);
    // Establish a database connection
    await client.connect();
    logger.info("initializing migrator");
    const migrator = new postgrator({
      migrationPattern: argv.schemaPath,
      driver: "pg",
      execQuery: (query) => client.query(query),
      database: argv.postgresDatabase,
    });

    logger.info("executing migration");
    const migrations = await migrator.migrate("max");
    _.forEach(migrations, (m) => {
      console.log(picocolors.green(m.name));
    });
    logger.info(`executed ${migrations.length} migrations`);
    process.exit(0);
  } catch (err) {
    notifyError(err);
    console.log(err);
    process.exit(1);
  }
};
