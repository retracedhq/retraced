import validateSession from "../../../security/validateSession";
import createSavedExport from "../../../models/saved_export/create";

export default async function handler(req) {
  const claims = await validateSession("viewer", req.get("Authorization"));
  const newSavedExport = await createSavedExport({
    projectId: req.params.projectId,
    environmentId: claims.environment_id,
    body: req.body.exportBody,
    version: req.body.version,
    name: req.body.name,
  });
  return {
    status: 201,
    body: JSON.stringify(newSavedExport),
  };
};
