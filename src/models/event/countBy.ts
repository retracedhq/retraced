import _ from "lodash";

import { Scope } from "../../security/scope";
import { scope, getESWithRetry, ClientWithRetry } from "../../persistence/elasticsearch";
import { applyOtelInstrument } from "../../metrics/opentelemetry/instrumentation";

const client: ClientWithRetry = getESWithRetry();

interface Options {
  groupBy: "action" | "group.id";
  scope: Scope;
  startTime: number;
  endTime: number;
  crud: string[];
  limit?: number;
}

interface Result {
  value: string;
  count: number;
}

export async function countBy(es: ClientWithRetry, opts: Options): Promise<Result[]> {
  const [index, scopeFilters] = scope(opts.scope);
  const filters: any[] = [];

  filters.push({
    range: { canonical_time: { gte: opts.startTime, lte: opts.endTime } },
  });

  filters.push({
    bool: {
      should: opts.crud.map((letter) => ({
        match: { crud: letter },
      })),
    },
  });

  const query = {
    bool: {
      filter: filters.concat(scopeFilters),
    },
  };

  const aggs = {
    groupedBy: {
      terms: {
        field: opts.groupBy,
        size: opts.limit,
      },
    },
  };

  const params: any = {
    index,
    type: "event",
    body: {
      query,
      aggs,
      size: 0,
    },
  };

  const response = await es.search(params);
  const data = _.map(response.body.aggregations.groupedBy.buckets, (bucket: any) => {
    const row: Result = {
      value: bucket.key,
      count: bucket.doc_count,
    };

    return row;
  });

  return data;
}

export default async function (opts: Options): Promise<Result[]> {
  return (await applyOtelInstrument("Elasticsearch.countBy", async () => {
    return await countBy(client, opts);
  })) as Result[];
}
