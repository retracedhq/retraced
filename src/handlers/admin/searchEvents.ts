import searchEvents, { Options } from "../../models/event/search";
import addDisplayTitles from "../../models/event/addDisplayTitles";
import Authenticator from "../../security/Authenticator";
import getPgPool from "../../persistence/pg";

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
  const apiToken = await new Authenticator(getPgPool()).getApiTokenOr401(req.headers.authorization, req.params.projectId);
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

  const results = await searchEvents(opts);

  const hydratedEvents = await addDisplayTitles({
    projectId: req.params.projectId,
    environmentId: req.query.environment_id,
    events: results.events!,
    source: "admin",
  });

  return {
    status: 200,
    body:   JSON.stringify({
      total_hits: results.totalHits,
      events:     hydratedEvents || [],
    }),
  };
}
