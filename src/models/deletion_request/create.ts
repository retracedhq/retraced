import moment from "moment";
import pg from "pg";
import { randomUUID } from "crypto";

import getPgPool from "../../persistence/pg";
import { DeletionRequest, DeletionRequestValues, rowFromDeletionRequest } from "./";

const pgPool = getPgPool();

export default async function create(
  drv: DeletionRequestValues,
  queryIn?: (q: string, v: any[]) => Promise<pg.QueryResult>
): Promise<DeletionRequest> {
  const query = queryIn || pgPool.query.bind(pgPool);

  const newDeletionRequest: DeletionRequest = {
    id: randomUUID().replace(/-/g, ""),
    created: moment(),
    ...drv,
  };

  const row = rowFromDeletionRequest(newDeletionRequest);

  const insertStmt = `
    insert into deletion_request (
      id, created, backoff_interval, resource_kind, resource_id
    ) values (
      $1, to_timestamp($2), $3, $4, $5
    )
  `;
  const insertVals = [row.id, row.created, row.backoff_interval, row.resource_kind, row.resource_id];

  await query(insertStmt, insertVals);

  return newDeletionRequest;
}
