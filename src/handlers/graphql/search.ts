import "source-map-support/register";
import * as _ from "lodash";

import queryEvents, { unrestricted, Options } from "../../models/event/query";
import addDisplayTitles from "../../models/event/addDisplayTitles";

export interface Args {
  query: string;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface Context {
  admin: boolean;
  projectId: string;
  environmentId: string;
  groupIds?: string[];
  targetIds?: string[];
}

export default async function search(
  q: any,
  args: Args,
  context: Context,
) {
  if (args.first && args.last) {
    throw { status: 400, err: new Error("Arguments 'first' and 'last' are exclusive") };
  }
  if (args.before && args.after) {
    throw { status: 400, err: new Error("Arguments 'before' and 'after' are exclusive") };
  }
  const opts: Options = {
    query: args.query,
    scope: {
      projectId: context.projectId,
      environmentId: context.environmentId,
      groupIds: context.groupIds || unrestricted,
      targetIds: context.targetIds || unrestricted,
    },
    sort: args.last ? "desc" : "asc",
    size: args.last || args.first,
  };

  if (args.after) {
    opts.cursor = decodeCursor(args.after);
  }
  if (args.before) {
    opts.cursor = decodeCursor(args.before);
  }

  const results = await queryEvents(opts);
  const events = await addDisplayTitles({
    projectId: context.projectId,
    environmentId: context.environmentId,
    events: results.events,
    source: context.admin ? "admin" : "viewer",
  });
  const edges = events.map((event) => {
    if (event.fields) {
      const fields: any[] = [];

      for (const field of event.fields) {
        fields.push({
          key: field,
          value: event.fields[field],
        });
      }

      event.fields = fields;
    }

    return {
      node: event,
      cursor: encodeCursor(event.canonical_time, event.id),
    };
  });

  // If searching with a cursor run the search again without it to get the total.
  let totalCount = results.totalHits;
  if (args.after || args.before) {
    delete opts.cursor;
    opts.size = 0;
    const { totalHits } = await queryEvents(opts);
    totalCount = totalHits;
  }

  return {
    totalCount,
    edges,
    pageInfo: {
      hasNextPage: opts.sort === "asc" && results.totalHits > results.events.length,
      hasPreviousPage: opts.sort === "desc" && results.totalHits > results.events.length,
    },
  };
}

function encodeCursor(timestamp: number, id: string): string {
  return new Buffer(`${timestamp},${id}`).toString("base64");
}

function decodeCursor(cursor: string): [number, string] {
  const parts = new Buffer(cursor, "base64").toString("utf8").split(",");
  const ts = parseInt(parts[0], 10);
  const id = parts[1];

  if (_.isNaN(ts) || !id) {
    throw { status: 400, err: new Error("Invalid cursor") };
  }

  return [ts, id];
}
