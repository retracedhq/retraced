import { checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteTemplate from "../../models/template/delete";

export default async function handle(
  authorization: string,
  projectId: string,
  templateId: string,
  environmentId: string
) {
  await checkAdminAccessUnwrapped(authorization, projectId, environmentId);

  const deleted = await deleteTemplate({ templateId, environmentId });

  if (!deleted) {
    throw { status: 404, err: new Error("Not found") };
  }

  return;
}
