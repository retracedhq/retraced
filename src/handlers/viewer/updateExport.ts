import { checkViewerAccess } from "../../security/helpers";
import updateSavedExport from "../../models/saved_export/update";

export default async function (req) {
  const claims = await checkViewerAccess(req);

  await updateSavedExport({
    id: req.params.exportId,
    body: req.body.exportBody,
    version: req.body.version,
    project_id: req.params.projectId,
    environment_id: claims.environmentId,
  });
  return {
    status: 204,
  };
}
