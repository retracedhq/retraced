import { checkAdminAccessUnwrapped } from "../../security/helpers";
import { responseFromTemplate, TemplateResponse, TemplateValues } from "../../models/template";
import createTemplate from "../../models/template/create";

export default async function (
  auth: string,
  projectId: string,
  environmentId: string,
  values: TemplateValues | TemplateValues[]
): Promise<TemplateResponse | TemplateResponse[]> {
  await checkAdminAccessUnwrapped(auth, projectId);

  let template: TemplateResponse | TemplateResponse[];
  if (Array.isArray(values)) {
    const newTemplates = await Promise.all(
      values.map((v) =>
        createTemplate({
          id: v.id,
          project_id: projectId,
          environment_id: environmentId,
          name: v.name,
          rule: v.rule,
          template: v.template,
        })
      )
    );
    template = newTemplates.map(responseFromTemplate);
  } else {
    const newTemplate = await createTemplate({
      id: values.id,
      project_id: projectId,
      environment_id: environmentId,
      name: values.name,
      rule: values.rule,
      template: values.template,
    });
    template = responseFromTemplate(newTemplate);
  }

  return template;
}
