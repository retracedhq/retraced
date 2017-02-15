import "source-map-support/register";
import * as _ from "lodash";
import * as moment from "moment";

import validateEitapiToken from "../../security/validateEitapiToken";
import createSavedSearch, { Options } from "../../models/saved_search/create";

export default async function handler(req) {
  const eitapiToken = await validateEitapiToken(req.get("Authorization"));
  if (!eitapiToken) {
    throw {
      err: new Error("Access denied"),
      status: 401,
    };
  }

  if (!req.body.name) {
    throw {
      err: new Error("Missing required 'name' field"),
      status: 400,
    };
  }

  // Start time comes to us as an ISO 8601 string.
  let startTime;
  if (req.body.start) {
    const maybe = moment(req.body.start);
    if (maybe.isValid()) {
      startTime = maybe.unix();
    }
  }

  const opts: Options = {
    name: req.body.name,
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
    actions: req.body.actions,
    actorIds: req.body.actor_ids,
    startTime,
  };

  const newSavedSearch = await createSavedSearch(opts);

  return {
    status: 201,
    body: JSON.stringify({
      id: newSavedSearch.id,
    }),
  };
}
