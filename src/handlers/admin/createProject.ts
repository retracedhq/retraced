import { checkAdminAccess } from "../../security/helpers";
import createProject from "../../models/project/create";

export default async function (req) {
  const claims = await checkAdminAccess(req);

  const project = await createProject({
    user_id: claims.userId,
    name: req.body.name,
  });

  return {
    status: 201,
    body: JSON.stringify({ project }),
  };
}
