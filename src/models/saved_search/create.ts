import QueryDescriptor from "../query_desc/def";
import getPgPool from "../../persistence/pg";
import uniqueId from "../uniqueId";

const pgPool = getPgPool();

export interface Options {
  name: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  actions?: string[];
  actorIds?: string[];
  startTime?: number;
}

export default async function (opts: Options) {
  const pg = await pgPool.connect();
  try {
    const desc: QueryDescriptor = {
      version: 1,
      showCreate: true,
      showRead: true,
      showUpdate: true,
      showDelete: true,
      actions: opts.actions,
      actorIds: opts.actorIds,
      startTime: opts.startTime,
    };
    const newSavedSearch = {
      id: uniqueId(),
      name: opts.name,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
      group_id: opts.groupId,
      query_desc: JSON.stringify(desc),
    };
    const insertStmt = `insert into saved_search (
      id, name, project_id, environment_id, group_id, query_desc
    ) values (
      $1, $2, $3, $4, $5, $6
    )`;
    const insertVals = [
      newSavedSearch.id,
      newSavedSearch.name,
      newSavedSearch.project_id,
      newSavedSearch.environment_id,
      newSavedSearch.group_id,
      newSavedSearch.query_desc,
    ];
    await pg.query(insertStmt, insertVals);

    return newSavedSearch;
  } finally {
    pg.release();
  }
}
