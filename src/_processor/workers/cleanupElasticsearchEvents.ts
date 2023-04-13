import config from "../../config";
import { logger } from "../logger";
import { getESWithoutRetry } from "../../persistence/elasticsearch";
import { Client } from "@opensearch-project/opensearch";

export default async function cleanupElasticsearch(job: any) {
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
  }
  return 0;
}
