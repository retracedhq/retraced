import { SavedExport } from "./";
import getPgPool from "../../persistence/pg";
import { randomUUID } from "crypto";

const pgPool = getPgPool();

export interface Options {
  name: string;
  body: string;
  projectId: string;
  environmentId: string;
  groupId: string;
}

export default async function createSavedExport(opts: Options): Promise<SavedExport> {
  const newSavedExport: SavedExport = {
    id: randomUUID().replace(/-/g, ""),
    name: opts.name,
    body: opts.body,
    project_id: opts.projectId,
    environment_id: opts.environmentId,
    group_id: opts.groupId,
  };

  const insertStmt = `insert into saved_export (
        id, name, body, project_id, environment_id, group_id
    ) values (
        $1, $2, $3, $4, $5, $6
    )`;
  const insertVals = [
    newSavedExport.id,
    newSavedExport.name,
    newSavedExport.body,
    newSavedExport.project_id,
    newSavedExport.environment_id,
    newSavedExport.group_id,
  ];
  await pgPool.query(insertStmt, insertVals);

  return newSavedExport;
}
