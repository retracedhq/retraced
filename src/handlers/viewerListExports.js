import validateSession from "../security/validateSession";
import listSavedExports from "../models/saved_export/list";

export default async function handler(req) {
  const authHeader = req.get("Authorization");
  const claims = await validateSession("viewer", authHeader);
  const list = await listSavedExports({
    project_id: req.params.projectId,
    environment_id: claims.environment_id,
    limit: req.query.limit,
  });
  return {
    status: 200,
    body: JSON.stringify(list),
  };
};
