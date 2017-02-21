import { checkAdminAccess } from "../../security/helpers";
import deepSearchEvents, { Options } from "../../models/event/deepSearch";

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
export default async function handler(req) {
  await checkAdminAccess(req);

  if (!req.query.environment_id) {
    throw { status: 400, err: new Error("Missing environment_id") };
  }

  const reqOpts = req.body.query;

  const opts: Options = {
    index: `retraced.${req.params.projectId}.${req.query.environment_id}`,
    sort: "desc",
    groupOmitted: true,
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
  return {
    status: 200,
    body: JSON.stringify({
      total_hits: results.totalHits,
      ids: results.eventIds || [],
    }),
  };
}
