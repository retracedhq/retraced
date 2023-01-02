import { checkAdminAccessUnwrapped } from "../../security/helpers";
import searchTemplateModels, { Options } from "../../models/template/search";
import { TemplateSearchResults } from "../../models/template";

/*
What we're expecting from clients:
----------------------------------
query: {
  length: number;
  offset: number;
}
*/

export default async function searchTemplates(
  auth: string,
  projectId: string,
  environmentId: string,
  length: number,
  offset: number
): Promise<TemplateSearchResults> {
  await checkAdminAccessUnwrapped(auth, projectId);

  const opts: Options = {
    index: `retraced.${projectId}.${environmentId}`,
    projectId,
    environmentId,
    sort: "asc",
    sortColumn: "name",

    length,
    offset,
  };

  const results = await searchTemplateModels(opts);

  return {
    total_hits: results.totalHits,
    templates: results.templates || [],
  };
}
