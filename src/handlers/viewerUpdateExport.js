import validateSession from "../security/validateSession";
import updateSavedExport from "../models/saved_export/update";

export default async function handler(req) {
  const claims = await validateSession("viewer", req.get("Authorization"));
  await updateSavedExport({
    id: req.params.exportId,
    body: opts.body.exportBody,
    version: opts.body.version,
    project_id: req.params.projectId,
    environment_id: claims.environment_id,
  });
  return {
    status: 204,
  };
};
