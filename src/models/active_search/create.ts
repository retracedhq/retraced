import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  savedSearchId: string;
  projectId: string;
  environmentId: string;
  groupId: string;
}

export default async function(opts: Options) {
  const pg = await pgPool.connect();
  try {
    const newActiveSearch = {
      id: uuid.v4().replace(/-/g, ""),
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
    await pg.query(insertStmt, insertVals);

    return newActiveSearch;

  } finally {
    pg.release();
  }
}
