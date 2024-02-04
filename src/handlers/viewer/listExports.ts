import { checkViewerAccess } from "../../security/helpers";
import listSavedExports from "../../models/saved_export/list";

export default async function (req) {
  const claims = await checkViewerAccess(req);
  const list = await listSavedExports({
    project_id: req.params.projectId,
    environment_id: claims.environmentId,
    group_id: claims.groupId,
    limit: req.query.limit,
  });
  return {
    status: 200,
    body: JSON.stringify(list),
  };
}
