import _ from "lodash";
import searchQueryParser from "search-query-parser";
import moment from "moment";
import { ApiResponse, RequestParams } from "@opensearch-project/opensearch";

import { Scope } from "../../security/scope";
import { scope, getESWithRetry, ClientWithRetry } from "../../persistence/elasticsearch";

const es: ClientWithRetry = getESWithRetry();

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

export interface TotalHits {
  value: number;
  relation?: string;
}

export interface Result {
  totalHits: TotalHits;
  events: any[];
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

  const newResp = await es.search(params);

  const bodyAny: any = params.body;
  const countParams = {
    index: params.index,
    body: {
      query: bodyAny.query,
    },
  };
  const newCount = await es.count(countParams);

  return {
    totalHits: { value: newCount.body.count },
    events: _.map(newResp.body.hits.hits, ({ _source }) => _source),
  };
}

// doAllQuery is not meant to be used interactively
// it will return all the results, which may take some time to query
export async function doAllQuery(opts: Options): Promise<Result> {
  const responseQueue: ApiResponse[] = [];
  let allHits: any[] = [];

  opts.cursor = undefined; // no cursor if getting all results
  const params = searchParams(opts);
  params.scroll = "30s"; // this means we have 30s to get the next entry in the scroll

  const newResp = await es.search(params);

  responseQueue.push(newResp);
  while (responseQueue.length) {
    const oneResp = responseQueue.shift(); // get a response from the queue
    allHits = allHits.concat(oneResp?.body?.hits?.hits); // append hits to the list of all hits

    const nextEvent = await es.scroll({
      // use the scroll API to get another response
      scroll_id: oneResp?.body?._scroll_id,
      scroll: "30s",
    });

    if (nextEvent.body.hits && nextEvent.body.hits.hits && nextEvent.body.hits.hits.length > 0) {
      // if this new response has hits, add it to the queue
      responseQueue.push(nextEvent);
    }
  }

  return {
    totalHits: { value: allHits.length },
    events: _.map(allHits, ({ _source }) => _source),
  };
}

function isPrefix(term: string) {
  return /\*$/.test(term);
}

function scrubDatetimeRange(input: string | string[]): [number, number] {
  if (!Array.isArray(input) || input.length !== 2) {
    throw {
      status: 400,
      err: new Error("The received field requires a range of two datetimes."),
    };
  }

  const range = (input as [string, string]).map((datetime) => moment.utc(datetime));
  range.forEach((m) => {
    if (!m.isValid()) {
      throw {
        status: 400,
        err: new Error(`Cannot parse received datetime ${JSON.stringify(range[0])}`),
      };
    }
  });

  return range.map((m) => m.valueOf()) as [number, number];
}

// exported for testing
export function parse(searchQuery: string): any {
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
      "external_id",
    ],
  };
  let keywords = searchQueryParser.parse(searchQuery, options);
  const q: any = {
    bool: {
      filter: [],
    },
  };
  if (keywords) {
    keywords = keywords as searchQueryParser.SearchParserResult;
    if (keywords.action) {
      if (isPrefix(keywords.action)) {
        q.bool.filter.push({
          prefix: { action: _.trimEnd(keywords.action, "*") },
        });
      } else {
        q.bool.filter.push({
          match: {
            action: { query: _.trimEnd(keywords.action, "*"), operator: "and" },
          },
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
        match: { "actor.id": { query: keywords["actor.id"], operator: "and" } },
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

    if (keywords.external_id) {
      q.bool.filter.push({
        match: { external_id: { query: keywords.external_id, operator: "and" } },
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
  }

  return q;
}

export function searchParams(opts: Options): RequestParams.Search {
  const searchQuery = parse(opts.query);
  const [index, securityFilters] = scope(opts.scope);

  searchQuery.bool.filter = searchQuery.bool.filter.concat(securityFilters);

  // Converts cursor to query filters. Remove after ???
  if (opts.cursor) {
    const [timestamp, id] = opts.cursor;
    const isAsc = /asc/.test(opts.sort);

    searchQuery.bool.filter.push({
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
    searchQuery.bool.filter.push({
      bool: {
        should: [
          {
            // include non-identical timestamps in range
            range: {
              canonical_time: {
                [isAsc ? "gt" : "lt"]: timestamp,
              },
            },
          },
          {
            // include identical timestamps with ids in range
            range: {
              id: {
                [isAsc ? "gt" : "lt"]: id,
              },
            },
          },
        ],
      },
    });
  }

  return {
    index,
    _source: "true",
    size: opts.size !== 0 ? opts.size : undefined,
    body: {
      query: searchQuery,
      sort: [{ canonical_time: opts.sort }],
    },
  };

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
