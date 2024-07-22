import _ from "lodash";

import { queryEventsPaginated, OptionsPaginated } from "../../models/event/query";
import { filterEventsPaginated } from "../../models/event/filter";
import addDisplayTitles from "../../models/event/addDisplayTitles";
import { Scope } from "../../security/scope";
import getGroups from "../../models/group/gets";
import config from "../../config";

const PG_SEARCH = !!config.PG_SEARCH;
const searcher = PG_SEARCH ? filterEventsPaginated : queryEventsPaginated;

export interface ArgsPaginated {
  query: string;
  pageOffset?: number;
  pageLimit: number;
  sortOrder?: "asc" | "desc";
  startCursor?: string;
}

export default async function searchPaginated(q: any, args: ArgsPaginated, context: Scope) {
  if (!args.pageOffset) {
    args.pageOffset = 0;
  }
  if (!args.pageLimit) {
    args.pageLimit = 20;
  }
  if (!args.sortOrder) {
    args.sortOrder = "desc";
  }
  const opts: OptionsPaginated = {
    query: args.query,
    scope: context,
    sortOrder: args.sortOrder,
    pageLimit: args.pageLimit,
    pageOffset: args.pageOffset,
  };

  if (args.startCursor) {
    opts.startCursor = decodeCursor(args.startCursor);
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

    if (event.metadata) {
      event.metadata = _.map(event.metadata, (value, key) => ({
        key,
        value,
      }));
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
      cursor: encodeCursor(
        event.canonical_time,
        event.id,
        opts.startCursor ? opts.startCursor[2] : results.totalHits.value
      ),
    };
  });

  // If searching with a cursor run the search again without it to get the total.
  const totalCount = opts.startCursor ? opts.startCursor[2] : results.totalHits.value;

  return {
    totalCount,
    edges:
      args.pageOffset + args.pageLimit < totalCount ? edges : edges.slice(0, totalCount - args.pageOffset),
  };
}

export function encodeCursor(timestamp: number, id: string, count: number): string {
  return Buffer.from(`${timestamp},${id},${count}`).toString("base64");
}

export function decodeCursor(cursor: string): [number, string, number] {
  const parts = Buffer.from(cursor, "base64").toString("utf8").split(",");
  const ts = parseInt(parts[0], 10);
  const id = parts[1];

  if (_.isNaN(ts) || !id) {
    throw { status: 400, err: new Error("Invalid cursor") };
  }

  if (parts.length !== 3) {
    throw { status: 400, err: new Error("Invalid cursor") };
  } else {
    const count = parseInt(parts[2], 10);
    if (_.isNaN(count)) {
      throw { status: 400, err: new Error("Invalid cursor") };
    }
    return [ts, id, count];
  }
}
