import { checkAdminAccess } from "../../security/helpers";
import getDashboard from "../../models/dashboard/get";

export default async function (req) {
  await checkAdminAccess(req);

  const dashboard = await getDashboard({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ dashboard }),
  };
}
