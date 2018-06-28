import "source-map-support/register";
import * as chalk from "chalk";
import * as _ from "lodash";
import * as uuid from "uuid";
import * as util from "util";
import * as ProgressBar from "progress";
import * as moment from "moment";

import getElasticsearch, { putAliases } from "../../persistence/elasticsearch";
import { Event } from "../../persistence/EventSource";
import PostgresEventSource from "../../persistence/PostgresEventSource";
import getPgPool from "../../persistence/pg";
import common from "../../common";

const pgPool = getPgPool();
const es = getElasticsearch();

exports.command = "postgres";
exports.desc = "reindex all events from postgres into elasticsearch";

exports.builder = {
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
};

exports.handler = (argv) => handler(argv).catch((err) => console.log(chalk.red(util.inspect(err))));

const handler = async (argv) => {
  let eventSource = new PostgresEventSource(pgPool, argv.pageSize);

  const esTempIndex = `retraced.reindex.${uuid.v4()}`;
  const esTargetIndex = `retraced.${argv.projectId}.${argv.environmentId}`;
  const esTargetWriteIndex = `retraced.${argv.projectId}.${argv.environmentId}.current`;

  const aliasesBlob = await es.cat.aliases({ name: esTargetIndex });
  let currentIndices: any = [];
  aliasesBlob.split("\n").forEach((aliasDesc) => {
    const parts = aliasDesc.split(" ");
    if (parts.length >= 2) {
      currentIndices.push(parts[1]);
    }
  });

  const aliasesBlobWrite = await es.cat.aliases({ name: esTargetWriteIndex });
  let currentIndicesWrite: any = [];
  aliasesBlobWrite.split("\n").forEach((aliasDesc) => {
    const parts = aliasDesc.split(" ");
    if (parts.length >= 2) {
      currentIndicesWrite.push(parts[1]);
    }
  });

  await es.indices.create({ index: esTempIndex });

  let badCount = 0;

  const eachPage = async (result: Event[]) => {
    console.log(`processing page with count ${result.length}`);
    const pbar = new ProgressBar("[:bar] :percent :etas", {
      incomplete: " ",
      width: 40,
      total: result.length,
    });

    const promises = result.map(async (row: Event) => {
      let actor;
      if (row.actor_id) {
        actor = await common.getActor(row.actor_id);
      }

      let target;
      if (row.object_id) { // -_-
        target = await common.getTarget(row.object_id);
      }

      // postgres you're killing me here with the naming
      const group: any = await common.getGroup(row.team_id);

      // Rename field group_id => id. If the group is from the cache, it may already have been fixed, so we have to check.
      if (group && !group.id) {
        group.id = group.group_id;
        _.unset(group, "group_id");
      }

      let indexableEvent: any = _.pick(row, [
        "id", "description", "action", "crud", "is_failure",
        "is_anonymous", "created", "received", "source_ip",
        "country", "loc_subdiv1", "loc_subdiv2", "raw",
        "canonical_time",
      ]);

      indexableEvent = _.mapValues(indexableEvent, (val, key) => {
        if (key === "created" || key === "received" || key === "canonical_time") {
          return moment(val).valueOf();
        }
        return val;
      });

      indexableEvent.group = _.mapValues(group, (val, key) => {
        if (key === "created_at" || key === "last_active") {
          return moment(val).valueOf();
        }
        if (key === "event_count") {
          return Number(val);
        }
        return val;
      });

      indexableEvent.actor = _.mapValues(actor, (val, key) => {
        if (key === "created"
          || key === "last_active"
          || key === "first_active") {
          return moment(val).valueOf();
        }
        if (key === "event_count") {
          return Number(val);
        }
        return val;
      });

      indexableEvent.target = _.mapValues(target, (val, key) => {
        if (key === "created"
          || key === "last_active"
          || key === "first_active") {
          return moment(val).valueOf();
        }
        if (key === "event_count") {
          return Number(val);
        }
        return val;
      });

      pbar.tick(1);

      return indexableEvent;
    });

    const toBeIndexedDirty = await Promise.all(promises);
    const toBeIndexed = toBeIndexedDirty.filter((o) => o);

    // Bulk index
    pbar.terminate();
    console.log();
    if (_.isEmpty(toBeIndexed)) {
      console.log(chalk.yellow("No valid rows to index!"));
      return;
    }

    console.log("running bulk index...");
    const body: any[] = [];
    for (const eventToIndex of toBeIndexed) {
      if (!eventToIndex) {
        continue;
      }

      [eventToIndex.actor, eventToIndex.target].forEach((obj) => {
        if (obj.foreign_id) {
          obj.id = obj.foreign_id;
        }
      });

      body.push({
        index: {
          _index: esTempIndex,
          _type: "event",
        },
      });
      body.push(eventToIndex);
    }

    es.bulk({ body }, (errr, resp, status) => {
      if (errr) {
        console.log(chalk.red(errr.stack));
        process.exit(1);
      }

      if (resp.errors) {
        _.forEach(resp.items, (item) => {
          _.forIn(item, (innerItem) => {
            if (innerItem.error) {
              console.log(chalk.red(util.inspect(innerItem.error)));
              console.log(util.inspect(innerItem.error, false, 100, true));
            }
          });
        });
        console.log(chalk.red("Errors returned by bulk op, unable to continue"));
        process.exit(1);
      }

      const isLastPage = result.length !== argv.pageSize;
      if (isLastPage) {
        finalize({ esTempIndex, esTargetIndex, currentIndices, esTargetWriteIndex, currentIndicesWrite, badCount});
      }
    });
  };

  const events: Event[] = await eventSource.iteratePaged(eachPage);
  for (let chunk of _.chunk(events, argv.pageSize)) {
    await eachPage(chunk);
  }
  finalize({ esTempIndex, esTargetIndex, currentIndices, esTargetWriteIndex, currentIndicesWrite, badCount });
};

function finalize({ esTempIndex, esTargetIndex, currentIndices, esTargetWriteIndex, currentIndicesWrite, badCount}) {

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

  putAliases(toAdd, toRemove)
    .then(() => {
      console.log("done!");
      if (badCount > 0) {
        console.log(`${badCount} of entries were invalid`);
      }
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
