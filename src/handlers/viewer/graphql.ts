import querystring from "querystring";
import { checkViewerAccess } from "../../security/helpers";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

import handler from "../graphql/handler";

export default async function (req) {
  const claims = await checkViewerAccess(req);
  const thisViewEvent: CreateEventRequest = {
    created: new Date(),
    action: claims.viewLogAction,
    crud: "r",
    actor: {
      id: claims.actorId,
    },
    group: {
      id: claims.groupId,
    },
    description: `Viewed the audit log`,
    source_ip: claims.ip,
  };

  let targetId;
  if (claims.scope) {
    const scope = querystring.parse(claims.scope);
    targetId = scope.target_id;
    thisViewEvent.target = {
      id: targetId,
    };
  }

  const results = await handler(req, {
    projectId: claims.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
    targetId,
  });

  if (!req.query.skipViewLogEvent) {
    await defaultEventCreater.saveRawEvent(claims.projectId, claims.environmentId, thisViewEvent);
  }

  return results;
}
