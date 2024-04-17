import getPgPool from "../../persistence/pg";
import uniqueId from "../uniqueId";

const pgPool = getPgPool();
const ERR_DUPLICATE_SINK_NAME = new Error("NAME_ALREADY_EXISTS");

export type CreateSinkOptions = {
  name?: string;
  environmentId: string;
  groupId: string;
  projectId: string;
  config: any;
  active: boolean;
};

export type Sink = {
  id: string;
  created: Date;
  name?: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  config: any;
  active: boolean;
};

export default async function createSink(opts: CreateSinkOptions): Promise<Sink> {
  const now = new Date();
  const id = uniqueId();
  const q = `INSERT INTO security_sink (id, created, name, project_id, environment_id, group_id, config, active)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
  const v = [
    id,
    now.toISOString(),
    opts.name || null,
    opts.projectId,
    opts.environmentId,
    opts.groupId,
    JSON.stringify(opts.config),
    opts.active ? 1 : 0,
  ];
  await pgPool.query(q, v as any);

  return {
    id,
    created: now,
    name: opts.name,
    projectId: opts.projectId,
    environmentId: opts.environmentId,
    groupId: opts.groupId,
    config: opts.config,
    active: false,
  };
}
