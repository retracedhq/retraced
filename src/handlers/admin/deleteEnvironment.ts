import { checkAdminAccess } from "../../security/helpers";
import deleteEnvironment from "../../models/environment/delete";

export default async function (req) {
  await checkAdminAccess(req);

  await deleteEnvironment({
    projectId: req.params.projectId,
    environmentId: req.params.environmentId,
  });

  return {
    status: 204,
  };
}
