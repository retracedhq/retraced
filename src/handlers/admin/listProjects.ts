import { checkAdminAccess } from "../../security/helpers";
import listProjects from "../../models/project/list";

export default async function (req) {
  const claims = await checkAdminAccess(req);

  const projects = await listProjects({
    user_id: claims.userId,
  });

  return {
    status: 200,
    body: JSON.stringify({ projects }),
  };
}
