import "source-map-support/register";
import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

// opts: userId, projectId
export default async function addUserToProject(opts) {
  let pg;
  try {
    pg = await pgPool.connect();
    const q = `insert into projectuser (
      id, project_id, user_id
    ) values (
      $1, $2, $3
    )`;
    const v = [
      uuid.v4().replace(/-/g, ""),
      opts.projectId,
      opts.userId,
    ];
    pg.query(q, v);
  } finally {
    pg.release();
  }
}
