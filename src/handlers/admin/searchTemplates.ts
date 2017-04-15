import { checkAdminAccess } from "../../security/helpers";
import searchTemplates, { Options } from "../../models/template/search";

/*
What we're expecting from clients:
----------------------------------
query: {
  length: number;
  offset: number;
}
*/
export default async function handler(req) {
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

  const results = await searchTemplates(opts);

  return {
    status: 200,
    body: JSON.stringify({
      total_hits: results.totalHits,
      templates: results.templates || [],
    }),
  };
}
