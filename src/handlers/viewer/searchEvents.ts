import * as _ from "lodash";
import * as querystring from "querystring";
import * as uuid from "uuid";
import * as moment from "moment";

import { checkViewerAccess } from "../../security/helpers";
import searchEvents, { Options } from "../../models/event/search";
import nsq from "../../persistence/nsq";
import addDisplayTitles from "../../models/event/addDisplayTitles";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

/*
What we're expecting from clients:
----------------------------------
query: {
  search_text: string;
  length: number;
  offset: number;
  start_time: number;
  end_time: number;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}
*/
export default async function(req) {
  const claims = await checkViewerAccess(req);
  const thisViewEvent: CreateEventRequest = {
    action: claims.viewLogAction,
    crud: "r",
    is_anonymous: true,
    group: {
      id: claims.groupId,
    },
    description: `${req.method} ${req.originalUrl}`,
    source_ip: req.ip,
  };

  const reqOpts = req.body.query;

  let targetIds;
  if (claims.scope) {
    const scope = querystring.parse(claims.scope);
    targetIds = [scope.target_id];
    thisViewEvent.target = { id: scope.target_id };
  }

  const opts: Options = {
    index: `retraced.${req.params.projectId}.${claims.environmentId}`,
    sort: "desc",
    groupId: claims.groupId,
    searchText: reqOpts.search_text,
    offset: reqOpts.offset,
    length: reqOpts.length,
    startTime: reqOpts.start_time,
    endTime: reqOpts.end_time,
    crud: {
      create: reqOpts.create,
      read: reqOpts.read,
      update: reqOpts.update,
      delete: reqOpts.delete,
    },
    targetIds,
  };

  const results = await searchEvents(opts);

  const hydratedEvents = await addDisplayTitles({
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    events: results.events!,
    source: "viewer",
  });

  const defaultQuery = {
    search_text: "",
    length: 25,
    create: true,
    read: false,
    update: true,
    delete: true,
  };
  if (!_.isEqual(defaultQuery, reqOpts)) {
    const job = JSON.stringify({
      taskId: uuid.v4().replace(/-/g, ""),
      projectId: req.params.projectId,
      environmentId: claims.environmentId,
      event: "viewer_search",
      timestamp: moment().valueOf(),
    });
    await nsq.produce("user_reporting_task", job);
  }
  defaultEventCreater.saveRawEvent(
    req.params.projectId,
    claims.environmentId,
    thisViewEvent,
  );

  return {
    status: 200,
    body: JSON.stringify({
      total_hits: results.totalHits,
      events: hydratedEvents || [],
    }),
  };
}
