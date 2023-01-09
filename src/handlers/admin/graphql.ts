import { checkAdminAccess } from "../../security/helpers";
import handler from "../graphql/handler";

export default async function (req) {
  await checkAdminAccess(req);

  return await handler(req, {
    projectId: req.params.projectId,
    environmentId: req.params.environmentId,
  });
}
