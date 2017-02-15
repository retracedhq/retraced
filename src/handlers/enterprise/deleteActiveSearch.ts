import * as _ from "lodash";

import validateEitapiToken from "../../security/validateEitapiToken";
import deleteActiveSearch from "../../models/active_search/delete";

export default async function handler(req) {
  const eitapiToken = await validateEitapiToken(req.get("Authorization"));
  if (!eitapiToken) {
    throw {
      err: new Error("Access denied"),
      status: 401,
    };
  }

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
