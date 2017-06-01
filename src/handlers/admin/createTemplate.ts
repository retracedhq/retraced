import { checkAdminAccess } from "../../security/helpers";
import createTemplate from "../../models/template/create";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const template = await createTemplate({
    project_id: req.params.projectId,
    environment_id: req.body.environment_id,
    name: req.body.name,
    rule: req.body.rule,
    template: req.body.template,
  });

  return {
    status: 201,
    body: JSON.stringify({ template }),
  };
}
