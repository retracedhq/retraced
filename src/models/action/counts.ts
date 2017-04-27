import "source-map-support/register";
import * as _ from "underscore";
import { instrument } from "monkit";
import * as Elasticsearch from "elasticsearch";

import { Scope } from "../../security/scope";
import getEs, { scope } from "../../persistence/elasticsearch";

const esClient = getEs();

interface Options {
  scope: Scope;
  startTime: number;
  endTime: number;
  crud: string[];
  limit?: number;
}

interface Result {
  action: string;
  count: number;
}

export async function countActions(es: Elasticsearch.Client, opts: Options): Promise<Result[]> {
  const [index, scopeFilters] = scope(opts.scope);
  const filters: any[] = [];

  filters.push({
    range: { canonical_time: { gte: opts.startTime, lte: opts.endTime } },
  });

  filters.push({
    bool: {
      should: opts.crud.map((letter) => ({
        term: { crud: letter },
      })),
    },
  });

  const query = {
    bool: {
      filter: filters.concat(scopeFilters),
    },
  };

  const aggs = {
    action: {
      terms: {
        field: "action",
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
  const data = _.map(response.aggregations.action.buckets, (bucket: any) => {
    const row: Result = {
      action: bucket.key,
      count:  bucket.doc_count,
    };

    return row;
  });

  return data;
}

export default async function(opts: Options): Promise<Result[]> {
  return await instrument("Elasticsearch.countActions", async () => {
    return await countActions(esClient, opts);
  });
}
