import _ from "lodash";
import querystring from "querystring";
import * as uuid from "uuid";
import moment from "moment";

import { checkViewerAccess } from "../../security/helpers";
import searchEvents, { Options } from "../../models/event/search";
import addDisplayTitles from "../../models/event/addDisplayTitles";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";
import { temporalClient } from "../../_processor/persistence/temporal";
import { saveUserReportingEventWorkflow } from "../../_processor/temporal/workflows";
import { createWorkflowId } from "../../_processor/temporal/helper";

export interface Job {
  taskId: string;
  projectId: string;
  environmentId: string;
  event: string;
  timestamp: number;
}

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

  const reqOpts = req.body.query;

  let targetIds: string[] = [];
  if (claims.scope) {
    const scope = querystring.parse(claims.scope);
    if (typeof scope.target_id === "string") {
      targetIds = [scope.target_id];
      thisViewEvent.target = { id: scope.target_id };
    } else if (scope.target_id instanceof Array) {
      targetIds = scope.target_id;
      if (scope.target_id.length > 0) {
        thisViewEvent.target = { id: scope.target_id[0] };
      }
    }
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
    events: results.events || [],
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
    const job = {
      taskId: uuid.v4().replace(/-/g, ""),
      projectId: req.params.projectId,
      environmentId: claims.environmentId,
      event: "viewer_search",
      timestamp: moment().valueOf(),
    };

    await temporalClient.start(saveUserReportingEventWorkflow, {
      workflowId: createWorkflowId(job.projectId, job.environmentId),
      taskQueue: "events",
      args: [job],
    });
  }

  defaultEventCreater.saveRawEvent(req.params.projectId, claims.environmentId, thisViewEvent);

  return {
    status: 200,
    body: JSON.stringify({
      total_hits: results.totalHits,
      events: hydratedEvents || [],
    }),
  };
}
