import * as _ from "lodash";

import { checkAdminAccess } from "../../security/helpers";
import listInvites from "../../models/invite/list";

export default async function(req) {
  const claims = await checkAdminAccess(req);

  const invites = await listInvites({
    projectId: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({ invites }),
  };
}
