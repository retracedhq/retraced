import "source-map-support/register";

import { checkAdminAccess } from "../../security/helpers";
import verifyProjectAccess from "../../security/verifyProjectAccess";
import handler from "../graphql/handler";

export default async function(req) {
  const claims = await checkAdminAccess(req);
  const isAllowed = await verifyProjectAccess({
    userId: claims.userId,
    projectId: req.params.projectId,
  });

  if (!isAllowed) {
    return {
      status: 403,
    };
  }

  return await handler(req, {
    projectId: req.params.projectId,
    environmentId: req.params.environmentId,
    admin: true,
  });
}
