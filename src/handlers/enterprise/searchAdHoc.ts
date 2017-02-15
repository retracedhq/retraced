import * as _ from "lodash";

import validateEitapiToken from "../../security/validateEitapiToken";
import deepSearchEvents, { Options } from "../../models/event/deepSearch";

export default async function handler(req) {
  const eitapiToken = await validateEitapiToken(req.get("Authorization"));
  if (!eitapiToken) {
    throw {
      err: new Error("Access denied"),
      status: 401,
    };
  }

  // pageSize (max 200)
  // actor_id
  // action
  // check etag header for scroll_id
  const opts: Options = {
    index: `retraced.${eitapiToken.project_id}.${eitapiToken.environment_id}`,
    sort: "desc",
    groupId: eitapiToken.group_id,
    actorIds: [req.query.actor_id],
    actions: [req.query.action],
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
