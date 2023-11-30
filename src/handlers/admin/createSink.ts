import { checkAdminAccess } from "../../security/helpers";
import createSink from "../../models/vectorsink/create";
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
  } else if (!req.body.name) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Name is required" }),
    };
  } else if (
    req.body.config === undefined ||
    req.body.config === null ||
    typeof req.body.config !== "object"
  ) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Config is required" }),
    };
  } else if (Object.keys(req.body.config).length === 0) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Config cannot be empty" }),
    };
  } else {
    const sink = await createSink({
      name: req.body.name,
      environmentId: req.params.environmentId,
      groupId: req.params.groupId,
      projectId: req.params.projectId,
      config: req.body.config,
      active: false,
    });

    return {
      status: 201,
      body: JSON.stringify(sink),
    };
  }
}
