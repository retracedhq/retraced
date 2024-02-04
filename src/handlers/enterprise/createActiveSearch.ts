import { checkEitapiAccessUnwrapped } from "../../security/helpers";
import getSavedSearch from "../../models/saved_search/get";
import createActiveSearch from "../../models/active_search/create";
import { Responses } from "../../router";

export interface CreateActiveSearchRequest {
  /** An id of an existing saved search to use */ // eslint-disable-next-line
  saved_search_id: string;
}

export interface ActiveSearchId {
  /** The ID of the created search */
  id: string;
}

export default async function handler(req) {
  return Responses.created(await enterpriseCreateActiveSearch(req.get("Authorization"), req.body));
}

export async function enterpriseCreateActiveSearch(
  auth: string,
  activeSearchRequest: CreateActiveSearchRequest
): Promise<ActiveSearchId> {
  const eitapiToken = await checkEitapiAccessUnwrapped(auth);
  const savedSearchId = activeSearchRequest.saved_search_id;

  if (!savedSearchId) {
    throw {
      err: new Error("Missing required 'saved_search_id' field"),
      status: 400,
    };
  }

  // Make sure the saved search actually exists...
  const savedSearch = await getSavedSearch({
    savedSearchId,
  });
  if (!savedSearch) {
    throw {
      err: new Error(`Saved search not found (id=${savedSearchId})`),
      status: 404,
    };
  }

  const newActiveSearch = await createActiveSearch({
    savedSearchId,
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
  });

  return {
    id: newActiveSearch.id,
  };
}
