import "source-map-support/register";
import * as _ from "lodash";
import * as searchQueryParser from "search-query-parser";
import * as moment from "moment";
import { ApiResponse, RequestParams } from '@elastic/elasticsearch'

import { Scope } from "../../security/scope";
import getEs, { scope, getNewElasticsearch } from "../../persistence/elasticsearch";
import { logger } from "../../logger";

const es = getEs();
const newEs = getNewElasticsearch();

// An empty list for groupIds or targetIds means unrestricted.
export const unrestricted = Object.seal([]);

// query may contain untrusted searches a user is not authorized to see.
// scope contains the security-relevant restrictions on results.
export interface Options {
  query: string;
  scope: Scope;
  sort: "asc" | "desc";
  size?: number;
  cursor?: [number, string];
}

export interface Result {
  totalHits: number;
  events: any[];
}

export interface ParsedQuery {
    action: string | string[];
    crud: string | string[];
    received: string | string[];
    created: string | string[];
    "actor.id": string | string[];
    "actor.name": string | string[];
    description: string | string[];
    location: string | string[];
    text?: string | string[];
}

export default async function query(opts: Options): Promise<Result> {
    const result = await doQuery(opts);

    delete opts.cursor;
    opts.size = 0;

    const total = await doQuery(opts);

    return {
        totalHits: total.totalHits,
        events: result.events,
    };
}

async function doQuery(opts: Options): Promise<Result> {
  const params = searchParams(opts);

  logger.debug(`raw newParams: ${JSON.stringify(params)}\n`)

  const newResp = await newEs.search(params);

  if (!newResp.body || !newResp.body.hits) {
    logger.info(`raw newParams: ${JSON.stringify(params)}\n`)
    logger.info(`raw newResp: ${JSON.stringify(newResp)}\n`)
  } else {
    logger.debug(`raw newResp: ${JSON.stringify(newResp)}\n`)
  }

  return {
    totalHits: newResp.body.hits.total,
    events: _.map(newResp.body.hits.hits, ({ _source }) => _source),
  };
}

function isPrefix(term: string) {
  return /\*$/.test(term);
}

function scrubDatetimeRange(input: string | string[]): [number, number] {
  if (!Array.isArray(input) || input.length !== 2) {
    throw { status: 400, err: new Error("The received field requires a range of two datetimes.")};
  }

  const range = (input as [string, string]).map((datetime) => moment.utc(datetime));
  range.forEach((m) => {
    if (!m.isValid()) {
      throw { status: 400, err: new Error(`Cannot parse received datetime ${range[0]}`) };
    }
  });

  return range.map((m) => m.valueOf()) as [number, number];
}

// exported for testing
export function parse(query: string): any {
  const options = {
    keywords: [
      "action",
      "crud",
      "received",
      "created",
      "actor.id",
      "actor.name",
      "description",
      "location",
    ],
  };
  const keywords = searchQueryParser.parse(query, options);
  const q: any = {
    bool: {
      filter: [],
    },
  };

  if (keywords.action) {
    if (isPrefix(keywords.action)) {
      q.bool.filter.push({
        prefix: {action: _.trimEnd(keywords.action, "*")},
      });
    } else {
      q.bool.filter.push({
        match: {action: { query: _.trimEnd(keywords.action, "*"), operator: "and" } },
      });
    }
  }

  if (keywords.crud) {
    // crud:c,d will have been split to ["c", "d"]
    if (Array.isArray(keywords.crud)) {
      q.bool.filter.push({
        bool: {
          should: keywords.crud.map((letter) => ({
            match: { crud: letter },
          })),
        },
      });
    } else {
      q.bool.filter.push({
        match: { crud: keywords.crud },
      });
    }
  }

  if (keywords.received) {
    const range = scrubDatetimeRange(keywords.received);

    q.bool.filter.push({
      range: {
        received: {
          gte: range[0].valueOf(),
          lt: range[1].valueOf(),
        },
      },
    });
  }

  if (keywords.created) {
    const range = scrubDatetimeRange(keywords.created);

    q.bool.filter.push({
      range: {
        created: {
          gte: range[0].valueOf(),
          lt: range[1].valueOf(),
        },
      },
    });
  }

  if (keywords["actor.id"]) {
    q.bool.filter.push({
      match: { "actor.id": { query: keywords["actor.id"], operator: "and" }  },
    });
  }

  if (keywords["actor.name"]) {
    q.bool.filter.push({
      match: { "actor.name": keywords["actor.name"] },
    });
  }

  if (keywords.description) {
    q.bool.filter.push({
      match: { description: keywords.description },
    });
  }

  if (keywords.location) {
    q.bool.filter.push({
      multi_match: {
        query: keywords.location,
        fields: ["country", "loc_subdiv1", "loc_subdiv2"],
      },
    });
  }

  if ((_.isString(keywords) && keywords) || keywords.text) {
    q.bool.filter.push({
      query_string: {
        query: _.isString(keywords) ? keywords : keywords.text,
        default_operator: "and",
      },
    });
  }

  return q;
}

export function searchParams(opts: Options): RequestParams.Search {
  const query = parse(opts.query);
  const [index, securityFilters] = scope(opts.scope);

  query.bool.filter = query.bool.filter.concat(securityFilters);

  // Converts cursor to query filters. Remove after ???
  if (opts.cursor) {
    const [timestamp, id] = opts.cursor;
    const isAsc = /asc/.test(opts.sort);

    query.bool.filter.push({
      bool: {
        must_not: {
          range: {
            canonical_time: {
              [isAsc ? "lt" : "gt"]: timestamp,
            },
          },
        },
      },
    });
    query.bool.filter.push({
      bool: {
        should: [{
          // include non-identical timestamps in range
          range: {
            canonical_time: {
              [isAsc ? "gt" : "lt"]: timestamp,
            },
          },
        }, {
          // include identical timestamps with ids in range
          range: {
            id: {
              [isAsc ? "gt" : "lt"]: id,
            },
          },
        }],
      },
    });
  }

  return {
    index: index,
    _source: "true",
    size: opts.size != 0 ? opts.size : undefined,
    body: {
      query: query,
      sort: {
        canonical_time: opts.sort
      }
    },
  }

  // return {
  //   index,
  //   type: "_doc",
  //   _source: true,
  //   size: opts.size != 0 ? opts.size : undefined,
  //   sort: [`canonical_time: ${opts.sort}`],
  //   search_after: opts.cursor,
  //   body: { query },
  // };
}