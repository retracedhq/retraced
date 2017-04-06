import { checkAdminAccess } from "../../security/helpers";
import listGroupMembers from "../../models/group/list";

export default async function (req) {
  await checkAdminAccess(req);

  const groupMembers = await listGroupMembers({
    projectId: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({ groupMembers }),
  };
}
