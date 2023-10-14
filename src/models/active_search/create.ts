import { randomUUID } from "crypto";

import getPgPool from "../../persistence/pg";
import { ActiveSearch } from "./index";

const pgPool = getPgPool();

export interface Options {
  savedSearchId: string;
  projectId: string;
  environmentId: string;
  groupId: string;
}

export default async function (opts: Options): Promise<ActiveSearch> {
  const newActiveSearch: ActiveSearch = {
    id: randomUUID().replace(/-/g, ""),
    project_id: opts.projectId,
    environment_id: opts.environmentId,
    group_id: opts.groupId,
    saved_search_id: opts.savedSearchId,
  };
  const insertStmt = `insert into active_search (
      id, project_id, environment_id, group_id, saved_search_id
    ) values (
      $1, $2, $3, $4, $5
    )`;
  const insertVals = [
    newActiveSearch.id,
    newActiveSearch.project_id,
    newActiveSearch.environment_id,
    newActiveSearch.group_id,
    newActiveSearch.saved_search_id,
  ];
  await pgPool.query(insertStmt, insertVals);

  return newActiveSearch;
}
