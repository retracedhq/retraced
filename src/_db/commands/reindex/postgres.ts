import "source-map-support/register";
import * as chalk from "chalk";
import * as uuid from "uuid";
import * as util from "util";

import getElasticsearch, { putAliases } from "../../persistence/elasticsearch";
import PostgresEventSource from "../../persistence/PostgresEventSource";
import getPgPool from "../../persistence/pg";
import { logger } from "../../../logger";
import { makePageIndexer } from "./shared/page";

export const command = "postgres";
export const desc = "reindex all events from postgres into elasticsearch";

export const builder: any = {
  projectId: {
    alias: "p",
    demand: true,
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
  startDate: {
  },
  endDate: {
  },
  dryRun: {
    default: false,
  },
};

export const handler = async (argv) => {
  logger.info({msg: "starting handler"});
  const pgPool = getPgPool();
  const es: any = getElasticsearch();

  let pgPreResults;
  if (argv.startDate && argv.endDate) {
    console.log(chalk.yellow(`Reindexing time range: [${new Date(argv.startTime).toISOString()}, ${new Date(argv.endTime).toISOString()}`));
    pgPreResults = await pgPool.query("SELECT COUNT(1) FROM ingest_task WHERE $1::tsrange @> received", [`[${new Date(argv.startTime).toISOString()}, ${new Date(argv.endTime).toISOString()})`]);
    console.log(chalk.yellow(`Postgres source events in range: ${pgPreResults.rows[0].count}`));
  } else {
    pgPreResults = await pgPool.query("SELECT COUNT(1) FROM ingest_task");
    console.log(chalk.yellow(`Postgres source events in range: ${pgPreResults.rows[0].count}`));
  }

  const eventSource = new PostgresEventSource(pgPool, argv.startDate, argv.endDate, argv.pageSize);

  const esTempIndex = `retraced.reindex.${uuid.v4()}`;
  const esTargetIndex = `retraced.${argv.projectId}.${argv.environmentId}`;
  const esTargetWriteIndex = `retraced.${argv.projectId}.${argv.environmentId}.current`;

  logger.info({msg: "computed new index names",
    esTempIndex,
    esTargetIndex,
    esTargetWriteIndex,
  });

  const aliasesBlob = await es.cat.aliases({ name: esTargetIndex });
  const currentIndices: string[] = [];
  if (!aliasesBlob) {
    logger.error({msg: "no aliasesBlob"});
  }
  aliasesBlob.split("\n").forEach((aliasDesc) => {
    const parts = aliasDesc.split(" ");
    if (parts.length >= 2) {
      currentIndices.push(parts[1]);
    }
  });
  logger.info({msg: "found current read indices",
    count: currentIndices.length,
  });

  const aliasesBlobWrite = await es.cat.aliases({ name: esTargetWriteIndex });
  const currentIndicesWrite: string[] = [];
  if (!aliasesBlobWrite) {
    logger.error({msg: "no aliasesBlobWrite"});
  } else {
    aliasesBlobWrite.split("\n").forEach((aliasDesc) => {
      const parts = aliasDesc.split(" ");
      if (parts.length >= 2) {
        currentIndicesWrite.push(parts[1]);
      }
    });
  }

  logger.info({msg: "found current write indices",
    count: currentIndicesWrite.length,
  });

  await es.indices.create({ index: esTempIndex });

  logger.info({msg: "created temp index",
    esTempIndex,
  });

  const eachPage = makePageIndexer(esTempIndex);

  logger.info({msg: "iterating paged"});

  await eventSource.iteratePaged(eachPage);
  logger.info({msg: "finished", esTempIndex, esTargetIndex, currentIndices, esTargetWriteIndex, currentIndicesWrite });
  finalize( argv.dryRun, esTempIndex, esTargetIndex, currentIndices, esTargetWriteIndex, currentIndicesWrite );
};

function finalize( dryRun: boolean, esTempIndex: string, esTargetIndex: string, currentIndices: string[], esTargetWriteIndex: string, currentIndicesWrite: string[]) {

  const toAdd = [{
    index: esTempIndex,
    alias: esTargetIndex,
  }, {
    index: esTempIndex,
    alias: esTargetWriteIndex,
  }];

  const toRemove = currentIndices.map((a) => ({
    index: a,
    alias: esTargetIndex,
  }));

  currentIndicesWrite.forEach((a) => toRemove.push({
    index: a,
    alias: esTargetWriteIndex,
  }));
  logger.info({toAdd, toRemove});

  if (dryRun) {
    console.log(chalk.yellow(`
    --dryRun was set, skipping final index rotation.
    Index changes for completing the reindex manually are shown above. If you'd like to use these indices, you should:
        - remove aliases from the indices listed in toRemove,
        - add aliases to the indices listed in toAdd`,
    ));
    process.exit(0);
  }

  putAliases(toAdd, toRemove)
    .then(() => {
      console.log("done!");
      console.log(`index: ${esTempIndex}`);
      console.log(`alias: ${esTargetIndex}`);
      if (currentIndices.length > 0) {
        console.log(`note: aliases were removed from the following indices: ${util.inspect(currentIndices)}`);
        console.log(`they can probably be safely deleted now.`);
      }
      process.exit(0);
    })
    .catch((errrr) => {
      throw errrr;
    });
}
