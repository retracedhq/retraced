import { checkAdminAccess } from "../../security/helpers";
import createSink from "../../models/vectorsink/create";
import hydrateSink from "../../models/vectorsink/hydrate";

export default async function (req) {
  await checkAdminAccess(req);

  const sink = await createSink({
    name: req.body.name,
    environmentId: req.params.environmentId,
    groupId: req.params.groupId,
    projectId: req.params.projectId,
    config: req.body.config,
    active: false,
    created: Date.now(),
  });

  const hydrated = await hydrateSink(sink);

  return {
    status: 201,
    body: JSON.stringify({ sink: hydrated }),
  };
}
