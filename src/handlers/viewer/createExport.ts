import { checkViewerAccess } from "../../security/helpers";
import createSavedExport from "../../models/saved_export/create";

export default async function(req) {
  const claims = await checkViewerAccess(req);
  const newSavedExport = await createSavedExport({
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
    body: req.body.exportBody,
    name: req.body.name,
  });
  return {
    status: 201,
    body: JSON.stringify(newSavedExport),
  };
}
