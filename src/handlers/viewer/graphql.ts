import "source-map-support/register";
import { checkViewerAccess, scopeTargets } from "../../security/helpers";

import handler from "../graphql/handler";

export default async function(req) {
  const claims = await checkViewerAccess(req);

  return await handler(req, {
    projectId: claims.projectId,
    environmentId: claims.environmentId,
    groupIds: [claims.groupId],
    targetIds: await scopeTargets(claims),
    admin: false,
  });
}
