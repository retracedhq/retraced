import { randomUUID } from "crypto";

import getPgPool from "../../persistence/pg";
import { EnterpriseToken } from "./";

const pgPool = getPgPool();

export interface Opts {
  displayName: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  viewLogAction: string;
}

export default async function createEitapiToken(opts): Promise<EnterpriseToken> {
  const pg = await pgPool.connect();
  try {
    const newEitapiToken: EnterpriseToken = {
      id: randomUUID().replace(/-/g, ""),
      display_name: opts.displayName,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
      group_id: opts.groupId,
      view_log_action: opts.viewLogAction,
    };
    const insertStmt = `insert into eitapi_token (
      id, display_name, project_id, environment_id, group_id, view_log_action
    ) values (
      $1, $2, $3, $4, $5, $6
    )`;
    const insertVals = [
      newEitapiToken.id,
      newEitapiToken.display_name,
      newEitapiToken.project_id,
      newEitapiToken.environment_id,
      newEitapiToken.group_id,
      newEitapiToken.view_log_action,
    ];
    await pg.query(insertStmt, insertVals);

    return newEitapiToken;
  } finally {
    pg.release();
  }
}
