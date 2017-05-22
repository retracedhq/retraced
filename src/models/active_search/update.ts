
import getPgPool from "../../persistence/pg";
import getActiveSearch from "./get";

const pgPool = getPgPool();

export interface Options {
  activeSearchId: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  updatedFields: {
    nextToken?: string;
    nextStartTime?: number;
  };
}

export default async function(opts: Options) {
  const pg = await pgPool.connect();
  try {
    const existingActiveSearch = await getActiveSearch({
      activeSearchId: opts.activeSearchId,
    });

    if (!existingActiveSearch) {
      throw new Error(`Can't update non-existent active search (id=${opts.activeSearchId})`);
    }

    const updatedActiveSearch = Object.assign({}, existingActiveSearch);
    if (opts.updatedFields.nextToken) {
      updatedActiveSearch.next_token = opts.updatedFields.nextToken;
    }
    if (opts.updatedFields.nextStartTime) {
      updatedActiveSearch.next_start_time = opts.updatedFields.nextStartTime;
    }

    const updateStmt = `
    update
      active_search
    set
      next_token = $5,
      next_start_time = $6
    where
      id = $1 and
      project_id = $2 and
      environment_id = $3 and
      group_id = $4
    `;
    const updateVals = [
      updatedActiveSearch.id,
      updatedActiveSearch.project_id,
      updatedActiveSearch.environment_id,
      updatedActiveSearch.group_id,
      updatedActiveSearch.next_token,
      updatedActiveSearch.next_start_time,
    ];
    const result = await pg.query(updateStmt, updateVals);
    if (result.rowCount !== 1) {
      throw new Error(`Expected updated row count of 1, got ${result.rowCount}`);
    }

    return updatedActiveSearch;

  } finally {
    pg.release();
  }
}
