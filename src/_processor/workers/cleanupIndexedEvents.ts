import config from "../../config";
import { logger } from "../logger";
import { getESWithoutRetry } from "../../persistence/elasticsearch";
import { Client } from "@opensearch-project/opensearch";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function cleanupIndexedEvents(job: any) {
  const { projectId, environemntId, beforeTimestamp } = job;
  // Delete from indexed_events
  if (!config.PG_SEARCH) {
    // Delee from elasticsearch by query with timestamp less than beforeTimestamp
    const alias = `retraced.${projectId}.${environemntId}.current`;
    const es: Client = getESWithoutRetry();
    const result = await es.deleteByQuery({
      index: alias,
      body: {
        query: {
          bool: {
            must: [{ range: { received: { lt: +beforeTimestamp } } }],
          },
        },
      },
    });
    logger.info(`Old events deleted from elasticsearch: ${result.body.deleted}}`);
    return result.body.deleted;
  } else {
    const q = `
    DELETE FROM indexed_events
      WHERE 
        project_id = $1 AND
        environment_id = $2 AND
        to_timestamp(CAST(doc->>'received' AS BIGINT) / 1000) < $3`;
    const values = [projectId, environemntId, new Date(beforeTimestamp)];
    const res = await pgPool.query(q, values);
    logger.info(`Old events deleted from indexed_events: ${res.rowCount}`);
    return res.rowCount;
  }
}
