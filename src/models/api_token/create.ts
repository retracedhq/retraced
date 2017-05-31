import * as uuid from "uuid";
import * as moment from "moment";

import getPgPool, { Querier } from "../../persistence/pg";
import {
  ApiToken,
  ApiTokenValues,
  rowFromApiToken,
} from "./";

const pgPool = getPgPool();

export default async function create(
  projectId: string, environmentId: string, values: ApiTokenValues,
  querier?: Querier,
): Promise<ApiToken> {
  querier = querier || pgPool;

  const newApiToken: ApiToken = {
    token: uuid.v4().replace(/-/g, ""),
    created: moment(),
    projectId,
    environmentId,
    ...values,
  };

  const row = rowFromApiToken(newApiToken);

  const insertStmt = `insert into token (
      token, created, disabled, name, environment_id, project_id
    ) values (
      $1, to_timestamp($2), $3, $4, $5, $6
    )`;
  const insertVals = [
    row.token,
    row.created,
    row.disabled,
    row.name,
    row.environment_id,
    row.project_id,
  ];
  await querier.query(insertStmt, insertVals);

  return newApiToken;
}
