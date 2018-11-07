import "source-map-support/register";
import * as chalk from "chalk";
import * as _ from "lodash";
import * as util from "util";
import * as ProgressBar from "progress";
import * as moment from "moment";

import getElasticsearch from "../../../persistence/elasticsearch";
import { Event } from "../../../persistence/EventSource";
import common from "../../../common";
import { logger } from "../../../../logger";

const es = getElasticsearch();

export const makePageIndexer = (writeIndex: string) => async (result: Event[]) => {
  logger.info(`processing page with count ${result.length}`);
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
        _index: writeIndex,
        _type: "event",
      },
    });
    body.push(eventToIndex);
  }

  logger.info(`indexing page with size ${result.length}`);
  await new Promise<void>((resolve, reject) => {
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

      logger.info(`finished index`);
      resolve();
    });
  });
};
