import "source-map-support/register";
import * as querystring from "querystring";
import { checkViewerAccess } from "../../security/helpers";

import handler from "../graphql/handler";

export default async function(req) {
  const claims = await checkViewerAccess(req);

  let targetId;
  if (claims.scope) {
    const scope = querystring.parse(claims.scope);
    targetId = scope.target_id;
  }

  return await handler(req, {
    projectId: claims.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
    targetId,
  });
}
