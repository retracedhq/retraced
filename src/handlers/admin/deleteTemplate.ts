import { checkAdminAccess } from "../../security/helpers";
import deleteTemplate from "../../models/template/delete";

export default async function handle(
  authorization: string,
  projectId: string,
  templateId: string,
  environmentId: string,
) {
  const claims = await checkAdminAccess(authorization, projectId, environmentId);

  const deleted = await deleteTemplate({ templateId, environmentId });

  if (!deleted) {
    throw { status: 404, err: new Error("Not found") };
  }

  console.log(`AUDIT user ${claims.userId} deleted template ${templateId} in ${environmentId}`);

  return;

}
