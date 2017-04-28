import "source-map-support/register";
import * as _ from "lodash";
import * as moment from "moment";

import { Scope } from "../../security/scope";
import actionCounts from "../../models/action/counts";

const defaultPageSize = 20;

export interface Args {
  type: "action" | "group";
  startTime?: string;
  endTime?: string;
  crud?: string;
  first?: number;
  after?: string;
}

export default async function counts(
  // root query object provided by graphql, not used
  q: any,
  args: Args,
  context: Scope,
) {
  const begin = args.after ? decodeCursor(args.after) + 1 : 0;
  const limit = _.isNumber(args.first) ? args.first : defaultPageSize;
  const end = begin + limit;

  let crud = ["c", "r", "u", "d"];

  if (_.isString(args.crud)) {
    crud = args.crud
      .trim()
      .toLowerCase()
      .split("");
  }

  let startTime = moment(0);
  let endTime = moment();

  if (args.startTime) {
    startTime = moment(args.startTime);
    if (!startTime.isValid()) {
      throw { status: 400, err: new Error("Invalid startTime") };
    }
  }
  if (args.endTime) {
    endTime = moment(args.endTime);
    if (!endTime.isValid()) {
      throw { status: 400, err: new Error("Invalid endTime") };
    }
  }

  // No size limit so the totalCount can be returned
  const counts = await actionCounts({
    crud,
    startTime: startTime.valueOf(),
    endTime: endTime.valueOf(),
    scope: context,
  });

  const edges = counts
    .map(({ action, count }, i) => ({
      node: action,
      count,
      cursor: encodeCursor(i),
    }))
    .slice(begin, end);

  return {
    totalCount: counts.length,
    edges,
    pageInfo: {
      hasNextPage: end < counts.length,
    },
 };
}

function encodeCursor(pos: number): string {
  return new Buffer(pos.toString()).toString("base64");
}

function decodeCursor(cursor: string): number {
  const pos = parseInt(new Buffer(cursor, "base64").toString("utf8"), 10);

  if (_.isNaN(pos)) {
    throw { status: 400, err: new Error("Invalid cursor") };
  }

  return pos;
}
