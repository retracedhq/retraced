import * as _ from "lodash";
import getEs from "../../persistence/elasticsearch";

import { DashboardTile, DashboardOptions } from "../interfaces";

const es = getEs();

interface ActionRow {
  action: string;
  count: number;
}

export default async function(opts: DashboardOptions): Promise<any> {
  const filters: any = [];

  filters.push({
    range: { canonical_time: { gte: opts.startTime } },
  });

  filters.push({
    range: { canonical_time: { lte: opts.endTime } },
  });

  const query = {
    bool: {
      filter: filters,
    },
  };

  const aggs = {
    action: {
      terms: {
        field: "action",
        size: 5,
      },
    },
  };

  const params: any = {
    index: opts.index,
    type: "event",
    _source: true,
    body: {
      query,
      aggs,
      size: 0,
    },
  };

  const response = await es.search(params);
  const data = _.map(response.aggregations.action.buckets, (bucket: any) => {
    const row: ActionRow = {
      action: bucket.key,
      count:  bucket.doc_count,
    };

    return row;
  })

  const tile: DashboardTile = {
    title: "Actions",
    type:  "actions",
    data,
  };

  return tile;
}
