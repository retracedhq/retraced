import _ from "lodash";

import queryEvents, { Options } from "../../models/event/query";
import filterEvents from "../../models/event/filter";
import addDisplayTitles from "../../models/event/addDisplayTitles";
import { Scope } from "../../security/scope";
import getGroups from "../../models/group/gets";
import config from "../../config";

const PG_SEARCH = !!config.PG_SEARCH;
const searcher = PG_SEARCH ? filterEvents : queryEvents;

export interface Args {
  query: string;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export default async function search(q: any, args: Args, context: Scope) {
  if (args.first && args.last) {
    throw {
      status: 400,
      err: new Error("Arguments 'first' and 'last' are exclusive"),
    };
  }
  if (args.before && args.after) {
    throw {
      status: 400,
      err: new Error("Arguments 'before' and 'after' are exclusive"),
    };
  }
  const opts: Options = {
    query: args.query,
    scope: context,
    sort: args.last ? "desc" : "asc",
    size: args.last || args.first,
  };

  if (args.after) {
    opts.cursor = decodeCursor(args.after);
  }
  if (args.before) {
    opts.cursor = decodeCursor(args.before);
  }

  const results = await searcher(opts);
  const events = await addDisplayTitles({
    projectId: context.projectId,
    environmentId: context.environmentId,
    events: results.events,
    source: context.groupId ? "viewer" : "admin",
  });

  // prepare to populate the group.name where there is only group.id
  const groupIdsWithoutName = events.reduce((accm, event) => {
    if (event.group && event.group.id && !event.group.name) {
      accm.push(event.group.id);
    }
    return accm;
  }, []);
  const groupListWithoutName = await getGroups({
    group_ids: groupIdsWithoutName,
  });
  const groupsByIdWithoutName = groupListWithoutName.reduce((accm, group) => {
    accm[group.group_id] = group;
    accm[group.group_id].id = group.group_id;
    return accm;
  }, {});

  const edges = events.map((event) => {
    if (event.group && event.group.id && !event.group.name) {
      event.group = groupsByIdWithoutName[event.group.id];
    }
    if (event.fields) {
      event.fields = _.map(event.fields, (value, key) => ({
        key,
        value,
      }));
    }

    if (event.target.fields) {
      event.target.fields = _.map(event.target.fields, (value, key) => ({
        key,
        value,
      }));
    }

    if (event.actor.fields) {
      event.actor.fields = _.map(event.actor.fields, (value, key) => ({
        key,
        value,
      }));
    }

    return {
      node: event,
      cursor: encodeCursor(event.canonical_time, event.id),
    };
  });

  // If searching with a cursor run the search again without it to get the total.
  const totalCount = results.totalHits.value;

  return {
    totalCount,
    edges,
    pageInfo: {
      hasNextPage: opts.sort === "asc" && totalCount > results.events.length,
      hasPreviousPage: opts.sort === "desc" && totalCount > results.events.length,
    },
  };
}

function encodeCursor(timestamp: number, id: string): string {
  return Buffer.from(`${timestamp},${id}`).toString("base64");
}

function decodeCursor(cursor: string): [number, string] {
  const parts = Buffer.from(cursor, "base64").toString("utf8").split(",");
  const ts = parseInt(parts[0], 10);
  const id = parts[1];

  if (_.isNaN(ts) || !id) {
    throw { status: 400, err: new Error("Invalid cursor") };
  }

  return [ts, id];
}
