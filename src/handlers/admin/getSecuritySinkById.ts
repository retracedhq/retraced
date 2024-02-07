import { checkAdminAccess } from "../../security/helpers";
import { getById } from "../../models/security_sink/get";
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
    const sink = await getById(req.params.sinkId);

    if (!sink) {
      return {
        status: 404,
        body: JSON.stringify({ error: "Sink not found" }),
      };
    }
    return {
      status: 200,
      body: JSON.stringify(sink),
    };
  }
}
