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
  cursor?: [number, string];
}

export interface Result {
  totalHits: number;
  events: any[];
}

export default async function (opts: Options): Promise<Result> {
  const params = searchParams(opts);

  polyfillSearchAfter(params);

  const resp = await es.search(params);

  return {
    totalHits: resp.hits.total,
    events: _.map(resp.hits.hits, ({ _source }) => _source),
  };
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

// If the scope is limited by groupIds or targetIds add them as filters.
// Restricts viewer and enterprise clients to authorized data.
export function scopeFilters(scope: Scope): any[] {
  const filters: any[] = [];

  if (scope.groupIds.length) {
    const should = scope.groupIds.reduce((clauses, groupId) => ([
      ...clauses,
      { term: { "group.id": groupId } },
      { term: { team_id: groupId } },
    ]), <any[]> []);

    filters.push({ bool: { should } });
  }

  if (scope.targetIds.length) {
    const should = scope.targetIds.map((targetId) => ({
      term: { "target.id": targetId },
    }));

    filters.push({ bool: { should } });
  }

  return filters;
}

export function searchParams(opts: Options): any {
  const query = parse(opts.query);
  const securityFilters = scopeFilters(opts.scope);

  query.bool.filter = query.bool.filter.concat(securityFilters);

  return {
    index: `retraced.${opts.scope.projectId}.${opts.scope.environmentId}`,
    type: "event",
    _source: true,
    size: opts.size,
    sort: [`canonical_time:${opts.sort}`, `id:${opts.sort}`],
    search_after: opts.cursor,
    body: { query },
  };
};

// Converts params.search_after to query filters. Remove after upgrade to ES 5.
export function polyfillSearchAfter(params: any) {
  if (params.search_after) {
    const [timestamp, id] = params.search_after;
    const isAsc = /asc/.test(params.sort[0]);

    params.body.query.bool.filter.push({
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
    params.body.query.bool.filter.push({
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
}
