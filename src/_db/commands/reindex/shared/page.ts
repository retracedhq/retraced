import picocolors from "picocolors";
import _ from "lodash";
import util from "util";
import ProgressBar from "progress";
import { mapValues } from "../../../../common/mapper";

import { getESWithoutRetry } from "../../../../persistence/elasticsearch";
import { Event } from "../../../persistence/EventSource";
import common from "../../../common";
import { logger } from "../../../../logger";
import { Client } from "@opensearch-project/opensearch";

let totalIndexed = 0;

export const makePageIndexer = (writeIndex: string) => async (result: Event[]) => {
  logger.info(`processing page with count ${result.length}`);
  const es: Client = getESWithoutRetry();
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
    if (row.object_id) {
      // -_-
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
      "id",
      "description",
      "action",
      "crud",
      "is_failure",
      "is_anonymous",
      "created",
      "received",
      "source_ip",
      "country",
      "loc_subdiv1",
      "loc_subdiv2",
      "canonical_time",
      "fields",
      "external_id",
      "metadata",
    ]);

    indexableEvent = mapValues(indexableEvent);

    indexableEvent.group = mapValues(group);

    indexableEvent.actor = mapValues(actor);

    indexableEvent.target = mapValues(target);

    pbar.tick(1);

    return indexableEvent;
  });

  const toBeIndexedDirty = await Promise.all(promises);
  const toBeIndexed = toBeIndexedDirty.filter((o) => o);

  // Bulk index
  pbar.terminate();
  if (_.isEmpty(toBeIndexed)) {
    console.log(picocolors.yellow("No valid rows to index!"));
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
        _type: "_doc",
      },
    });
    body.push(eventToIndex);
  }

  logger.info(`indexing page with size ${result.length}`);
  totalIndexed += result.length;
  await new Promise<void>((resolve) => {
    es.bulk({ body }, (errr, resp) => {
      if (errr) {
        console.log(picocolors.red(errr.stack));
        process.exit(1);
      }

      if (resp.body.errors) {
        _.forEach(resp.body.items, (item) => {
          _.forIn(item, (innerItem) => {
            if (innerItem.error) {
              console.log(picocolors.red(util.inspect(innerItem.error)));
              console.log(util.inspect(innerItem.error, false, 100, true));
            }
          });
        });
        console.log(picocolors.red("Errors returned by bulk op, unable to continue"));
        process.exit(1);
      }

      logger.info(`finished index, ${totalIndexed} completed so far`);
      resolve();
    });
  });
};
