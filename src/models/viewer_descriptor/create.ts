import moment from "moment";
import { randomUUID } from "crypto";

import ViewerDescriptor from "./def";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
  environmentId: string;
  groupId: string;
  isAdmin: boolean;
  viewLogAction: string;
  actorId: string;
  targetId?: string;
}

export default async function createViewerDescriptor(opts: Options): Promise<ViewerDescriptor> {
  const newDesc: ViewerDescriptor = {
    id: randomUUID().replace(/-/g, ""),
    projectId: opts.projectId,
    environmentId: opts.environmentId,
    groupId: opts.groupId,
    isAdmin: opts.isAdmin,
    viewLogAction: opts.viewLogAction,
    actorId: opts.actorId,
    created: moment().valueOf(),
    scope: "",
  };

  if (opts.targetId) {
    newDesc.scope = `target_id=${opts.targetId}`;
  }

  const q = `
        INSERT INTO viewer_descriptors (
            id,
            project_id,
            environment_id,
            group_id,
            is_admin,
            view_log_action,
            actor_id,
            created,
            scope
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
        )`;
  const values = [
    newDesc.id,
    newDesc.projectId,
    newDesc.environmentId,
    newDesc.groupId,
    newDesc.isAdmin,
    newDesc.viewLogAction,
    newDesc.actorId,
    moment(newDesc.created).format(),
    newDesc.scope,
  ];

  await pgPool.query(q, values);

  return newDesc;
}
