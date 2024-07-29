import picocolors from "picocolors";
import Walk from "@root/walk";
import path from "path";
import util from "util";

import { getESWithoutRetry } from "../../../persistence/elasticsearch";
import getPgPool from "../../persistence/pg";
import { Client } from "@opensearch-project/opensearch";
import { notifyError, startErrorNotifier } from "../../../error-notifier";

startErrorNotifier();

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

export const handler = async () => {
  const es: Client = getESWithoutRetry();
  const pgPool = getPgPool();

  try {
    const pg = await pgPool.connect();
    if (!pg) {
      notifyError(new Error("Couldn't connect to postgres"));
      console.log(picocolors.red("Couldn't connect to postgres"));
      process.exit(1);
    }

    await Walk.walk(getSchemaPath(), async (err, pathname, dirent) => {
      if (err) {
        notifyError(err);
        console.log(picocolors.red(err.stack));
        process.exit(1);
      }

      if (!dirent.isFile()) {
        return;
      }
      if (path.extname(pathname) !== ".js") {
        return;
      }

      pathname = path.basename(pathname);
      const tokens = pathname.split("-");
      const timestamp = Number(tokens[0]);
      const name = tokens[1].slice(0, -3);

      await pg.query(
        `create table if not exists es_migration_meta (
        id int primary key,
        created timestamp
      )`
      );
      const result = await pg.query("select * from es_migration_meta where id = $1", [timestamp]);

      if (result.rowCount) {
        console.log(picocolors.dim(`${timestamp} ${name}`));
        return Promise.resolve(false);
      }

      const esQuery = require(path.join(getSchemaPath(), pathname))();
      switch (esQuery.category) {
        default:
          throw new Error("Unknown category");

        case "indices": {
          switch (esQuery.op) {
            default:
              throw new Error("Unknown operation");

            case "putTemplate": {
              await es.indices.putIndexTemplate(esQuery.params);
              await pg.query(
                `insert into es_migration_meta (
              id, created
            ) values (
              $1, now()
            ) on conflict do nothing`,
                [timestamp]
              );
              console.log(picocolors.green(pathname));
            }
          }
        }
      }
    });

    process.exit(0);
  } catch (err) {
    notifyError(err);
    console.log(picocolors.red("Couldn't connect to postgres"));
    console.log(picocolors.red(util.inspect(err)));
    process.exit(1);
  }
};
