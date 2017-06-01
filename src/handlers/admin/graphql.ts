import "source-map-support/register";

import { checkAdminAccess } from "../../security/helpers";
import handler from "../graphql/handler";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  return await handler(req, {
    projectId: req.params.projectId,
    environmentId: req.params.environmentId,
  });
}
