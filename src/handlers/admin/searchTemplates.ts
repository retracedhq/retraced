import { checkAdminAccess, checkAdminAccessUnwrapped } from "../../security/helpers";
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
export async function deprecated(req) {
  await checkAdminAccess(req);

  if (!req.query.environment_id) {
    throw { status: 400, err: new Error("Missing environment_id") };
  }

  const reqOpts = req.body.query;

  const opts: Options = {
    index: `retraced.${req.params.projectId}.${req.query.environment_id}`,
    projectId: req.params.projectId,
    environmentId: req.query.environment_id,
    sort: "desc",
    sortColumn: "name",

    length: reqOpts.length,
    offset: reqOpts.offset,
  };

  const results = await searchTemplateModels(opts);

  return {
    status: 200,
    body: JSON.stringify({
      total_hits: results.totalHits,
      templates: results.templates || [],
    }),
  };
}

export default async function searchTemplates(
  auth: string,
  projectId: string,
  environmentId: string,
  length: number,
  offset: number,
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
