import _ from "lodash";
import { getNewElasticsearch } from "../../persistence/elasticsearch";
import { DashboardTile, DashboardOptions } from "../interfaces";

const newEs = getNewElasticsearch();

interface ActionRow {
  action: string;
  count: number;
}

export default async function (opts: DashboardOptions): Promise<any> {
  const filters: any = [];

  filters.push({
    range: { canonical_time: { gte: opts.startTime } },
  });

  filters.push({
    range: { canonical_time: { lte: opts.endTime } },
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

  const response = await newEs.search(params);
  const data = _.map(response.body.aggregations.action.buckets, (bucket: any) => {
    const row: ActionRow = {
      action: bucket.key,
      count: bucket.doc_count,
    };

    return row;
  });

  const tile: DashboardTile = {
    title: "Actions",
    type: "actions",
    data,
  };

  return tile;
}
