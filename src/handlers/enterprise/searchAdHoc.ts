import * as _ from "lodash";

import { checkEitapiAccess } from "../../security/helpers";
import searchEvents, { Options } from "../../models/event/search";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

export default async function handler(req) {
  const eitapiToken = await checkEitapiAccess(req);

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

  const results = await searchEvents(opts);

  const thisViewEvent: CreateEventRequest = {
    action: eitapiToken.view_log_action,
    crud: "r",
    actor: {
      id: `enterprise:${eitapiToken.id.substring(0, 7)}`,
      name: eitapiToken.displayName,
    },
    group: {
      id: eitapiToken.group_id,
    },
    description: `${req.method} ${req.originalUrl}`,
    source_ip: req.ip,
  };
  defaultEventCreater.saveRawEvent(
    eitapiToken.project_id,
    eitapiToken.environment_id,
    thisViewEvent,
  );

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
