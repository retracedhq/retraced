import "source-map-support/register";

import { checkAdminAccess } from "../../security/helpers";
import verifyProjectAccess from "../../security/verifyProjectAccess";
import handler from "../graphql/handler";

export default async function(req) {
  await checkAdminAccess(req);

  return await handler(req, {
    projectId: req.params.projectId,
    environmentId: req.params.environmentId,
  });
}
