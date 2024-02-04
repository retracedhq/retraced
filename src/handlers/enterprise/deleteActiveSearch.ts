import { checkEitapiAccess } from "../../security/helpers";
import deleteActiveSearch from "../../models/active_search/delete";

export default async function handler(req) {
  const eitapiToken = await checkEitapiAccess(req);

  if (!req.params.activeSearchId) {
    throw {
      err: new Error("Missing required 'id' parameter"),
      status: 400,
    };
  }

  await deleteActiveSearch({
    activeSearchId: req.params.activeSearchId,
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
  });

  return {
    status: 204,
  };
}
