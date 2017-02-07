import * as _ from "lodash";

import validateEitapiToken from "../../security/validateEitapiToken";
import "source-map-support/register";
import getSavedSearch from "../../models/saved_search/get";
import createActiveSearch from "../../models/active_search/create";

export default async function handler(req) {
  const eitapiToken = await validateEitapiToken(req.get("Authorization"));
  if (!eitapiToken) {
    throw {
      err: new Error("Access denied"),
      status: 401,
    };
  }

  if (!req.body.saved_search_id) {
    throw {
      err: new Error("Missing required 'saved_search_id' field"),
      status: 400,
    };
  }

  // Make sure the saved search actually exists...
  const savedSearch = await getSavedSearch({
    savedSearchId: req.body.saved_search_id,
  });
  if (!savedSearch) {
    throw {
      err: new Error(`Saved search not found (id=${req.body.saved_search_id})`),
      status: 404,
    };
  }

  const newActiveSearch = await createActiveSearch({
    savedSearchId: req.body.saved_search_id,
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
  });

  return {
    status: 201,
    body: JSON.stringify({
      id: newActiveSearch.id,
    }),
  };
}
