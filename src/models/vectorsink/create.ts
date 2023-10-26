import getPgPool from "../../persistence/pg";
import uniqueId from "../uniqueId";
import nsq from "../../persistence/nsq";

const pgPool = getPgPool();
const ERR_DUPLICATE_SINK_NAME = new Error("NAME_ALREADY_EXISTS");

export type CreateSinkOptions = {
  name: string;
  environmentId: string;
  groupId: string;
  projectId: string;
  config: any;
  active: boolean;
};

export type Sink = {
  id: string;
  created: Date;
  name: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  config: any;
  active: boolean;
};

export default async function createSink(opts: CreateSinkOptions): Promise<Sink> {
  // check for dupe name
  let q =
    "select count(1) from vectorsink where name = $1 AND project_id = $2 AND environment_id = $3 AND group_id = $4";
  let v: (string | number)[] = [opts.name, opts.projectId, opts.environmentId, opts.groupId];
  const dupeCheckResult = await pgPool.query(q, v);
  if (dupeCheckResult.rows[0].count > 0) {
    throw ERR_DUPLICATE_SINK_NAME;
  }

  const now = new Date();
  const id = uniqueId();
  q = `INSERT INTO vectorsink (id, created, name, project_id, environment_id, group_id, config, active)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
  v = [
    id,
    now.toISOString(),
    opts.name,
    opts.projectId,
    opts.environmentId,
    opts.groupId,
    JSON.stringify(opts.config),
    0,
  ];
  await pgPool.query(q, v);

  nsq.produce("sink_created", JSON.stringify({ id }));

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
