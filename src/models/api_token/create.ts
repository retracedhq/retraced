import * as uuid from "uuid";
import moment from "moment";

import getPgPool, { Querier } from "../../persistence/pg";
import {
  ApiToken,
  ApiTokenValues,
  rowFromApiToken,
} from "./";

const pgPool = getPgPool();

export default async function create(
  projectId: string,
  environmentId: string,
  values: ApiTokenValues,
  querier?: Querier,
  token?: string,
  readAccess?: boolean,
  writeAccess?: boolean,
): Promise<ApiToken> {
  querier = querier || pgPool;

  const newApiToken: ApiToken = {
    token: token || uuid.v4().replace(/-/g, ""),
    created: moment(),
    projectId,
    environmentId,
    ...values,
    readAccess: readAccess || true,
    writeAccess: writeAccess || true,
  };

  const row = rowFromApiToken(newApiToken);

  const insertStmt = `insert into token (
      token, created, disabled, name, environment_id, project_id, read_access, write_access
    ) values (
      $1, to_timestamp($2), $3, $4, $5, $6, $7, $8
    )`;
  const insertVals = [
    row.token,
    row.created,
    row.disabled,
    row.name,
    row.environment_id,
    row.project_id,
    row.read_access,
    row.write_access,
  ];
  await querier.query(insertStmt, insertVals);

  return newApiToken;
}
