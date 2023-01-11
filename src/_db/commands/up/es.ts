import picocolors from "picocolors";
import walk from "walk";
import path from "path";
import util from "util";
import bugsnag from "bugsnag";

import { getESWithoutRetry } from "../../../persistence/elasticsearch";
import getPgPool from "../../persistence/pg";
import { setupBugsnag } from "../../common";
import { Client } from "@elastic/elasticsearch";

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

function getSchemaPath() {
  return path.join(__dirname, "../../../../migrations/es");
}

export const handler = (argv) => {
  const es: Client = getESWithoutRetry();
  const pgPool = getPgPool();

  pgPool.connect((err, pg, done) => {
    if (err) {
      bugsnag.notify(err);
      console.log(picocolors.red("Couldn't connect to postgres"));
      console.log(picocolors.red(util.inspect(err)));
      process.exit(1);
    }
    const walker = walk.walk(getSchemaPath(), {
      followLinks: false,
    });

    walker.on("file", (root, stat, next) => {
      if (path.extname(stat.name) !== ".js") {
        next();
        return;
      }

      const tokens = stat.name.split("-");
      const timestamp = Number(tokens[0]);
      const name = tokens[1].slice(0, -3);

      pg.query(
        `create table if not exists es_migration_meta (
        id int primary key,
        created timestamp
      )`
      )
        .then(() => {
          return pg.query("select * from es_migration_meta where id = $1", [timestamp]);
        })
        .then((result) => {
          if (result.rowCount > 0) {
            console.log(picocolors.dim(`${timestamp} ${name}`));
            return Promise.resolve(false);
          }

          return new Promise<any>((resolve, reject) => {
            const esQuery = require(path.join(getSchemaPath(), stat.name))();
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
                      console.log(picocolors.green(stat.name));
                      resolve(true);
                    });
                  }
                }
              }
            }
          });
        })
        .then(((shouldSave) => {
          if (shouldSave) {
            return pg.query(
              `insert into es_migration_meta (
            id, created
          ) values (
            $1, now()
          ) on conflict do nothing`,
              [timestamp]
            );
          }
          return Promise.resolve({});
        }) as any)
        .then(() => {
          next(); // done! next file pls
        })
        .catch((err2) => {
          bugsnag.notify(err2);
          console.log(picocolors.red(err2.stack));
          process.exit(1);
        });
    });

    walker.on("errors", (root, stat, next) => {
      stat.forEach((n) => {
        bugsnag.notify(n.error);
        console.error(`[ERROR] ${n.name}`);
        console.error(n.error.message || `${n.error.code}:${n.error.path}`);
      });
      next();
    });

    walker.on("end", () => {
      process.exit(0);
    });
  });
};
