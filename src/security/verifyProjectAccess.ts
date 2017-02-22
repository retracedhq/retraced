import * as _ from "lodash";

import getApiToken from "../models/api_token/get";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
  userId?: string;
  apiToken?: string;
}

export default async function (opts: Options): Promise<boolean> {
  if (opts.userId) {
    const pg = await pgPool.connect();
    try {
      const q = "select * from projectuser where user_id = $1 and project_id = $2";
      const result = await pg.query(q, [opts.userId, opts.projectId]);
      return result.rowCount > 0;
    } finally {
      pg.release();
    }

  } else if (opts.apiToken) {
    const apiToken: any = await getApiToken(opts.apiToken);
    return apiToken && apiToken.project_id === opts.projectId;
  }

  return false;
}
