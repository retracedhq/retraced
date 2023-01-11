import _ from "underscore";
import { instrument } from "../../metrics";

import { Scope } from "../../security/scope";
import { scope, getNewElasticsearch } from "../../persistence/elasticsearch";
import { Client } from "@elastic/elasticsearch";

const newClient: Client = getNewElasticsearch();

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

export async function countBy(es: Client, opts: Options): Promise<Result[]> {
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
  return await instrument("Elasticsearch.countBy", async () => {
    return await countBy(newClient, opts);
  });
}
