import * as _ from "lodash";
import * as util from "util";
import * as uuid from "uuid";

import validateSession from "../../../security/validateSession";
import checkAccess from "../../../security/checkAccess";
import deepSearchEvents, { DeepSearchOptions } from "../../../models/event/deepSearch";
import getDisque from "../../../persistence/disque";

const disque = getDisque();

/*
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
export default async function handler(req) {
  const claims: any = await validateSession("viewer", req.get("Authorization"));
  const reqOpts = req.body.query;

  const opts: DeepSearchOptions = {
    index: `retraced.${req.params.projectId}.${claims.environment_id}`,
    sort: "desc",
    groupId: claims.group_id,
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
  };

  const results = await deepSearchEvents(opts);

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
      environmentId: claims.environment_id,
      event: "viewer_search",
      timestamp: new Date().getTime(),
    });
    const disqOpts = {
      retry: 600, // seconds,
      async: true,
    };
    await disque.addjob("user_reporting_task", job, 0, disqOpts);
  }

  return {
    status: 200,
    body: JSON.stringify({
      total_hits: results.totalHits,
      ids: results.eventIds || [],
    }),
  };
}
