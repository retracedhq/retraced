import { checkAdminAccess } from "../../security/helpers";
import { getByProjectEnvironmentGroupId } from "../../models/security_sink/get";
import getGroup from "../../models/group/gets";

export default async function (req) {
  await checkAdminAccess(req);

  const groupRes = await getGroup({
    group_ids: [req.params.groupId],
  });

  if (groupRes.length === 0) {
    return {
      status: 404,
      body: JSON.stringify({ error: "Group not found" }),
    };
  } else if (groupRes[0].project_id !== req.params.projectId) {
    return {
      status: 404,
      body: JSON.stringify({ error: "Group does not belong to the project" }),
    };
  } else if (groupRes[0].environment_id !== req.params.environmentId) {
    return {
      status: 404,
      body: JSON.stringify({ error: "Group does not belong to the environment" }),
    };
  } else {
    const sinks = await getByProjectEnvironmentGroupId(
      req.params.projectId,
      req.params.environmentId,
      req.params.groupId
    );

    return {
      status: 200,
      body: JSON.stringify(sinks),
    };
  }
}
