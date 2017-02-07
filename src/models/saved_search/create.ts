import * as uuid from "uuid";

import QueryDescriptor from "../query_desc/def";
import getPgPool from "../../persistence/pg";

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

export interface Result {
  newSavedSearchId: string;
}

export default async function(opts: Options) {
  const pg = await pgPool.connect();
  try {
    const desc: QueryDescriptor = {
      showCreate: true,
      showRead: true,
      showUpdate: true,
      showDelete: true,
      actions: opts.actions,
      actorIds: opts.actorIds,
      startTime: opts.startTime,
    };
    const newSavedSearch = {
      id: uuid.v4().replace(/-/g, ""),
      name: opts.name,
      query_desc: desc,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
      group_id: opts.groupId,
    };
    const insertStmt = `insert into eitapi_token (
      id, display_name, project_id, environment_id, group_id
    ) values (
      $1, $2, $3, $4, $5
    )`;
    const insertVals = [
      newEitapiToken.id,
      newEitapiToken.display_name,
      newEitapiToken.project_id,
      newEitapiToken.environment_id,
      newEitapiToken.group_id,
    ];
    await pg.query(insertStmt, insertVals);

    return newEitapiToken;

  } finally {
    pg.release();
  }
}
