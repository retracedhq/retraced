import "source-map-support/register";
import * as chalk from "chalk";
import * as util from "util";
import * as bugsnag from "bugsnag";

import getElasticsearch from "../../persistence/elasticsearch";
import getPgPool from "../../persistence/pg";
import { setupBugsnag } from "../../common";
import * as template from "../../../../migrations/es/template"

setupBugsnag();

export const command = "es";
export const describe = "migrate the elasticsearch database to the current schema";

export const builder = {
  elasticsearchNodes: {
    demand: true,
  },
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
};

export const handler = (argv) => {
  const es = getElasticsearch();
  const pgPool = getPgPool();

  pgPool.connect((err, pg, done) => {
    if (err) {
      bugsnag.notify(err);
      console.log(chalk.red("Couldn't connect to postgres"));
      console.log(chalk.red(util.inspect(err)));
      process.exit(1);
    }

    const esQuery = template();

    pg.query(`create table if not exists es_migration_meta (
      id int primary key,
      created timestamp
    )`)
      .then(() => {
        return pg.query("select * from es_migration_meta where id = $1", [esQuery.time]);
      })
      .then((result) => {
        if (result.rowCount > 0) {
          console.log(chalk.dim(`${esQuery.time} already completed`));
          return Promise.resolve(false);
        }

        return new Promise<any>((resolve, reject) => {
          const esQuery = template();
          switch (esQuery.category) {
            default:
              reject(new Error("Unknown category"));
              break;

            case "indices": {
              switch (esQuery.op) {
                default:
                  reject(new Error("Unknown operation"));
                  break;

                case "putTemplate": {
                  es.indices.putTemplate(esQuery.params, (err2, resp) => {
                    if (err2) {
                      reject(err2);
                      return;
                    }
                    console.log(chalk.green(`migration ${esQuery.time} completed`));
                    resolve(true);
                  });
                }
              }
            }
          }
        });
      })
      .then(<any> ((shouldSave) => {
        if (shouldSave) {
          return pg.query(`insert into es_migration_meta (
          id, created
        ) values (
          $1, now()
        ) on conflict do nothing`, [esQuery.time]);
        }
        return Promise.resolve();
      }))
      .catch((err2) => {
        bugsnag.notify(err2);
        console.log(chalk.red(err2.stack));
        process.exit(1);
      })
      .then(() => {
        process.exit(0);
      })
  });
};
