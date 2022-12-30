import { checkAdminAccessUnwrapped } from "../../security/helpers";
import {
  responseFromTemplate,
  TemplateResponse,
  TemplateValues,
} from "../../models/template";
import createTemplate from "../../models/template/create";

export default async function (
  auth: string,
  projectId: string,
  environmentId: string,
  values: TemplateValues
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
