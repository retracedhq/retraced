import getPgPool from "../../persistence/pg";
import { getESWithoutRetry } from "../../persistence/elasticsearch";
import { logger } from "../../logger";
import { Client } from "@opensearch-project/opensearch";
import config from "../../config";

const pgPool = getPgPool();
const es: Client = getESWithoutRetry();

interface Options {
  projectId: string;
  environmentId: string;
}

export default async function (opts: Options) {
  // We're doing a transaction here, so we want one consistent unique client
  // from the pool.
  const pg = await pgPool.connect();
  const rollback = async () => {
    try {
      await pg.query("ROLLBACK");
    } catch (err) {
      logger.info(`Rollback failed: ${err}`);
    }
  };

  try {
    await pg.query("BEGIN");
  } catch (beginErr) {
    logger.info(`Unable to begin Postgres transaction: ${beginErr}`);
    throw beginErr;
  }

  const queries = [
    "delete from environmentuser where environment_id = $1",
    "delete from token where environment_id = $1",
    "delete from display_template where environment_id = $1",
    "delete from actor where environment_id = $1",

    // TODO(zhaytee): Cascade to 'actionhour' rows. SQL constraint?
    "delete from action where environment_id = $1",

    "delete from target where environment_id = $1",
    "delete from eitapi_token where environment_id = $1",
    "delete from active_search where environment_id = $1",
    "delete from saved_search where environment_id = $1",
    "delete from saved_export where environment_id = $1",
    "delete from group_detail where environment_id = $1",
    "delete from active_actor where environment_id = $1",
    "delete from active_group where environment_id = $1",
    "delete from reporting_event where environment_id = $1",
    "delete from environment where id = $1",
  ];

  for (const q of queries) {
    try {
      await pg.query(q, [opts.environmentId]);
    } catch (pgErr) {
      logger.info(`
        Query failed during environment deletion: ${pgErr}
        Query was: ${q}
      `);
      await rollback();
      pg.release();
      throw pgErr;
    }
  }

  if (!config.PG_SEARCH) {
    // Kill the ES index before committing the Postgres deletions
    try {
      await new Promise((resolve, reject) => {
        const aliasName = `retraced.${opts.projectId}.${opts.environmentId}`;
        es.cat.aliases({ format: "json", name: aliasName }, (err, resp) => {
          if (err) {
            reject(err);
            return;
          }

          if (!Array.isArray(resp.body) || resp.body.length === 0) {
            reject(new Error(`No ES alias found with name '${aliasName}'`));
            return;
          } else if (resp.body.length > 1) {
            reject(new Error(`System is in disarray: more than one ES alias found with name '${aliasName}'`));
            return;
          }

          const indexName = resp.body[0].index;

          // Delete all aliases attached to the soon-to-be-deleted index
          es.indices.deleteAlias({ index: indexName, name: "_all" }, (err2) => {
            if (err2) {
              reject(err2);
              return;
            }

            // Finally, delete the index itself
            es.indices.delete({ index: indexName }, (err3) => {
              if (err3) {
                reject(err3);
                return;
              }

              resolve({});
            });
          });
        });
      });
    } catch (esErr) {
      logger.info(`Elasticsearch index deletion failed: ${esErr}`);
      await rollback();
      pg.release();
      throw esErr;
    }
  }

  await pg.query("COMMIT");
  pg.release();
}
