import { checkAdminAccess } from "../../security/helpers";
import createInvite from "../../models/group/invite";

export default async function (req) {
  checkAdminAccess(req);

  const invite = await createInvite({
    email: req.body.email,
    project_id: req.params.projectId,
  });

  return {
    status: 201,
    body: JSON.stringify({ invite }),
  };
}
