import "source-map-support/register";
import * as _ from "lodash";
import * as searchQueryParser from "search-query-parser";

import getEs from "../../persistence/elasticsearch";

const es = getEs();

// An empty list for groupIds or targetIds means unrestricted.
export const unrestricted = Object.seal([]);
export interface Scope {
  projectId: string;
  environmentId: string;
  groupIds: string[];
  targetIds: string[];
}

// query may contain untrusted searches a user is not authorized to see.
// scope contains the security-relevant restrictions on results.
export interface Options {
  query: string;
  scope: Scope;
  sort: "asc" | "desc";
  size?: number;
  searchAfter?: [number, string];
}

export interface Result {
  totalHits: number;
  events: any[];
}

export default async function (opts: Options): Promise<Result> {
  const query = parse(opts.query);

  // If the scope is limited by groupIds or targetIds add them as filters.
  // The index enforces the projectId and environmentId of the scope.
  if (opts.scope.groupIds.length) {
    const should = opts.scope.groupIds.reduce((clauses, groupId) => ([
      ...clauses,
      { term: { "group.id": groupId } },
      { term: { team_id: groupId } },
    ]), <any[]> []);

    query.bool.filter.push({ bool: { should } });
  }
  if (opts.scope.targetIds.length) {
    const should = opts.scope.targetIds.map((targetId) => ({
      term: { "target.id": targetId },
    }));

    query.bool.filter.push({ bool: { should } });
  }

  const params = {
    index: `retraced.${opts.scope.projectId}.${opts.scope.environmentId}`,
    type: "event",
    _source: true,
    size: opts.size,
    sort: ["canonical_time:${opts.sort}", "id:${opts.sort}"],
    body: { query },
  };

  // polyfill for ES 5's search_after
  if (opts.searchAfter) {
    // first exclude timestamps out of range
    query.bool.filter.push({
      bool: {
        must_not: {
          range: {
            canonical_time: {
              [opts.sort === "asc" ? "lt" : "gt"]: opts.searchAfter[0],
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
              [opts.sort === "asc" ? "gt" : "lt"]: opts.searchAfter[0],
            },
          },
        }, {
          // include identical timestamps with ids in range
          range: {
            id: {
              [opts.sort === "asc" ? "gt" : "lt"]: opts.searchAfter[1],
            },
          },
        }],
      },
    });
  }

  const resp = await es.search(params);

  const result: Result = {
    totalHits: resp.hits.total,
    events: _.map(resp.hits.hits, ({ _source }) => _source),
  };

  return result;
};

function isPrefix(term: string) {
  return /\*$/.test(term);
}

// exported for testing
export function parse(query: string): any {
  const options = {
    keywords: [
      "action",
    ],
  };
  const keywords = searchQueryParser.parse(query, options);
  const q: any = {
    bool: {
      filter: [],
    },
  };

  if (isPrefix(keywords.action)) {
    q.bool.filter.push({
      prefix: {action: _.trimEnd(keywords.action, "*")},
    });
  } else {
    q.bool.filter.push({
      term: {action: _.trimEnd(keywords.action, "*")},
    });
  }

  return q;
};
