import * as _ from "lodash";

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

// name (req)
// actor_ids
// actions
// start
  const opts: Options = {
    index: `retraced.${eitapiToken.project_id}.${eitapiToken.environment_id}`,
    sort: "desc",
    groupId: eitapiToken.group_id,
    actorId: req.query.actor_id,
    action: req.query.action,
    length: req.query.page_size ? _.min([req.query.page_size, 200]) : undefined,
    scrollLifetime: "5m",
    scrollId: req.get("ETag"),
    crud: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
  };

  opts.newScroll = !opts.scrollId;

  const results = await deepSearchEvents(opts);

  const response: any = {
    status: 200,
    body: JSON.stringify(results.events || []),
  };
  if (results.scrollId) {
    response.headers = {
      ETag: results.scrollId,
    };
  }

  return response;
}
