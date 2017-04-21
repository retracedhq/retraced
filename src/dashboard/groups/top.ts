import * as _ from "lodash";
import getEs from "../../persistence/elasticsearch";
import getsGroup from "../../models/group/gets";

import { DashboardTile, DashboardOptions } from "../interfaces";

const es = getEs();

interface GroupRow {
  name?: string;
  id: string;
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

  filters.push({
    bool: {
      should: opts.crud.map((letter) => ({
        term: { crud: letter },
      })),
    },
  });

  const query = {
    bool: {
      filter: filters,
    },
  };

  const aggs = {
    group: {
      terms: {
        field: "group.id",
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
  const rows = _.map(response.aggregations.group.buckets, (bucket: any) => {
    const row: GroupRow = {
      id: bucket.key,
      name: "Unknown Group",
      count: bucket.doc_count,
    };

    return row;
  });

  const getsGroupOpts = {
    group_ids: _.map(rows, (row) => {
      return row.id;
    }),
  };
  const groups = await getsGroup(getsGroupOpts);
  const data = _.map(rows, (row) => {
    // Find the group name in the groups array
    const group: any = _.find(groups, { group_id: row.id });
    if (group) {
      row.name = group.name;
    }
    return row;
  });
  const tile: DashboardTile = {
    title: "Groups",
    type: "groups",
    data,
  };

  return tile;
}
