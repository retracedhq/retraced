import "source-map-support/register";
import chalk from "chalk";
import _ from "lodash";
import postgrator from "postgrator";
import bugsnag from "bugsnag";
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
        default: process.env.DEPLOYMENT_TYPE === "compose" ? "/src/migrations/pg" : "./src/migrations/pg",
    },
};

logger.info("registering handler");
export const handler = (argv) => {
    try {
        logger.child({ up: "pg", schemaPath: argv.schemaPath }).info("beginning handler");
        const cs = `tcp://${argv.postgresUser}:${argv.postgresPassword}@${argv.postgresHost}:${argv.postgresPort}/${argv.postgresDatabase}`;
        logger.info("initializing migrator");
        const migrator = new postgrator({
            migrationDirectory: argv.schemaPath,
            driver: "pg",
            connectionString: cs,
            requestTimeout: 1000 * 10,
        });

        logger.info("executing migration");
        migrator.migrate("max").then((migrations) => {
            _.forEach(migrations, (m) => {
                console.log(chalk.green(m.name));
            });
            process.exit(0);
        });
    } catch (err) {
        bugsnag.notify(err);
        console.log(err);
    }
};
