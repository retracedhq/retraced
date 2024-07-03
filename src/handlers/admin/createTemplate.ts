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

  if (Array.isArray(values)) {
    const newTemplates: TemplateResponse[] = [];
    for (const value of values) {
      const newTemplate = await createTemplate({
        id: value.id,
        project_id: projectId,
        environment_id: environmentId,
        name: value.name,
        rule: value.rule,
        template: value.template,
      });
      newTemplates.push(responseFromTemplate(newTemplate));
    }
    return newTemplates;
  } else {
    const newTemplate = await createTemplate({
      id: values.id,
      project_id: projectId,
      environment_id: environmentId,
      name: values.name,
      rule: values.rule,
      template: values.template,
    });
    return responseFromTemplate(newTemplate);
  }
}
