import { checkAdminAccess } from "../../security/helpers";
import listGroup from "../../models/group/list";
import listEnvironments from "../../models/environment/list";

export default async function (req) {
  await checkAdminAccess(req);

  const envs = await listEnvironments({
    project_id: req.params.projectId,
  });

  const group = await listGroup({
    environments: envs,
    project_id: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({ group }),
  };
}
