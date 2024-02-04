import picocolors from "picocolors";
import PostgresEventSource from "../../persistence/PostgresEventSource";
import getPgPool from "../../persistence/pg";
import { logger } from "../../../logger";
import { makePageIndexer } from "./shared/page";
import searchES, { Options } from "../../../models/event/search";

const pgPool = getPgPool();

export const command = "range";
export const desc = "reindex a time range of events from postgres into elasticsearch";
export const builder = {
  projectId: {
    alias: "p",
  },
  environmentId: {
    alias: "e",
    demand: true,
  },
  elasticsearchNodes: {
    demand: true,
  },
  postgresUser: {
    demand: true,
  },
  postgresPort: {
    demand: true,
  },
  postgresDatabase: {
    demand: true,
  },
  postgresHost: {
    demand: true,
  },
  postgresPassword: {
    demand: true,
  },
  pageSize: {
    default: 5000,
  },
  startTime: {
    demand: true,
  },
  endTime: {
    demand: true,
  },
  dryRun: {
    default: false,
  },
};

export const handler = async (argv) => {
  console.log(
    picocolors.yellow(
      `Reindexing time range: [${new Date(
        argv.startTime
      ).toISOString()}, ${new Date(argv.endTime).toISOString()}]`
    )
  );

  const pgPreResults = await pgPool.query("SELECT COUNT(1) FROM ingest_task WHERE $1::tsrange @> received", [
    `[${new Date(argv.startTime).toISOString()}, ${new Date(argv.endTime).toISOString()})`,
  ]);

  console.log(picocolors.yellow(`Postgres source events in range: ${pgPreResults.rows[0].count}`));

  const esSearchOpts: Options = {
    index: `retraced.${argv.projectId}.${argv.environmentId}`,
    startTime: new Date(argv.startTime).valueOf(),
    endTime: new Date(argv.endTime).valueOf(),
    length: 1,
    sort: "asc",
    groupOmitted: true,
    crud: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
  };
  const esPreResults = await searchES(esSearchOpts);

  console.log(
    picocolors.yellow(`ElasticSearch destination events in range: ${esPreResults.totalHits} (approximate)`)
  );

  logger.info({
    msg: "reindexing time range",
    startTime: argv.startTime,
    endTime: argv.endTime,
    postgresCount: pgPreResults.rows[0].count,
    elasticsearchCount: esPreResults.totalHits,
  });

  if (argv.dryRun) {
    console.log(
      picocolors.yellow(`
    --dryRun was set, skipping range reindex`)
    );
    process.exit(0);
  }

  const eventSource = new PostgresEventSource(pgPool, argv.startTime, argv.endTime, argv.pageSize);
  const esTargetWriteIndex = `retraced.${argv.projectId}.${argv.environmentId}.current`;
  const eachPage = makePageIndexer(esTargetWriteIndex);

  await eventSource.iteratePaged(eachPage);
};
