import "source-map-support/register";
import * as uuid from "uuid";

import getPgPool, { Querier } from "../../persistence/pg";
import populateEnvUser from "../environmentuser/populate_from_project";

const pgPool = getPgPool();

export interface Options {
  userId: string;
  projectId: string;
}

export default async function addUserToProject(opts: Options, pg: Querier = pgPool) {
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
  await pg.query(q, v);

  await populateEnvUser({
    project_id: opts.projectId,
    user_id: opts.userId,
  }, pg);
}
