import { checkAdminAccess } from "../../security/helpers";
import deleteMember from "../../models/group/deleteMember";

export default async function (req) {
  await checkAdminAccess(req);

  await deleteMember({
    projectId: req.params.projectId,
    userId: req.params.userId,
  });

  return {
    status: 204,
  };
}
