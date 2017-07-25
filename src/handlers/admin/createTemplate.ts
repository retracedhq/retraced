import { checkAdminAccess, checkAdminAccessUnwrapped } from "../../security/helpers";
import { responseFromTemplate, TemplateResponse, TemplateValues } from "../../models/template";
import createTemplate from "../../models/template/create";

export async function deprecated(req) {
  await checkAdminAccess(req);

  const template = await createTemplate({
    project_id: req.params.projectId,
    environment_id: req.body.environment_id,
    name: req.body.name,
    rule: req.body.rule,
    template: req.body.template,
  });

  return {
    status: 201,
    body: JSON.stringify({
      template: Object.assign(template, { created: template.created.unix() }),
    }),
  };
}

export default async function(
  auth: string,
  projectId: string,
  environmentId: string,
  values: TemplateValues,
): Promise<TemplateResponse> {
  await checkAdminAccessUnwrapped(auth, projectId);

  const template = await createTemplate({
    id: values.id,
    project_id: projectId,
    environment_id: environmentId,
    name: values.name,
    rule: values.rule,
    template: values.template,
  });

  return responseFromTemplate(template);
}
