import { checkAdminAccess } from "../../security/helpers";
import createSink from "../../models/vectorsink/create";

export default async function (req) {
  await checkAdminAccess(req);

  // TODO: validate if groupId > projectId
  // TODO: validate if environmentId > projectId

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
    body: JSON.stringify({ sink }),
  };
}
