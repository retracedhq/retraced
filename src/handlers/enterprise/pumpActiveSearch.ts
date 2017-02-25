import * as uuid from "uuid";
import * as _ from "lodash";

import { checkEitapiAccess } from "../../security/helpers";
import searchEvents, { Options } from "../../models/event/search";
import getSavedSearch from "../../models/saved_search/get";
import getActiveSearch from "../../models/active_search/get";
import updateActiveSearch from "../../models/active_search/update";
import QueryDescriptor from "../../models/query_desc/def";

export default async function handler(req) {
  const eitapiToken = await checkEitapiAccess(req);

  if (!req.params.activeSearchId) {
    throw {
      err: new Error("Missing required 'id' parameter"),
      status: 400,
    };
  }

  const activeSearch = await getActiveSearch({
    activeSearchId: req.params.activeSearchId,
  });

  if (!activeSearch) {
    throw {
      err: new Error(`Active search not found (id=${req.params.activeSearchId})`),
      status: 404,
    };
  }

  // Look up the template
  const savedSearch = await getSavedSearch({
    savedSearchId: activeSearch.saved_search_id,
  });

  if (!savedSearch) {
    throw {
      err: new Error(`Active search (id=${req.params.activeSearchId}) refers to a non-existent saved search (id=${activeSearch.saved_search_id})`),
      status: 500,
    };
  }

  const queryDesc: QueryDescriptor = JSON.parse(savedSearch.query_desc);

  const searchOpts: Options = {
    index: `retraced.${eitapiToken.project_id}.${eitapiToken.environment_id}`,
    sort: "asc",
    groupId: eitapiToken.group_id,
    length: req.query.page_size ? _.min([req.query.page_size, 200]) : undefined,
    crud: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
  };

  switch (queryDesc.version) {
    case 1:
      searchOpts.actions = queryDesc.actions;
      searchOpts.actorIds = queryDesc.actorIds;
      break;

    default:
      throw new Error(`Unknown query descriptor version: ${queryDesc.version}`);
  }

  if (req.query.next) {
    // Resume the search where we left off.

    if (req.query.next !== activeSearch.next_token) {
      throw {
        err: new Error(`No such 'next' token: ${req.query.next}`),
        status: 404,
      };
    }

    if (!activeSearch.next_start_time) {
      throw {
        err: new Error(`Active search is malformed: next_start_time=${activeSearch.next_start_time}`),
        status: 500,
      };
    }

    searchOpts.startTime = activeSearch.next_start_time;
  }

  const results = await searchEvents(searchOpts);
  let nextToken;
  if (results.events && results.events.length > 0) {
    nextToken = uuid.v4().replace(/-/g, "");
    const lastEvent = results.events[results.events.length - 1];
    let nextStartTime = lastEvent.created;
    if (!nextStartTime) {
      nextStartTime = lastEvent.received;
    }
    // nextStartTime = Math.floor(nextStartTime / 1000);
    nextStartTime += 1;
    await updateActiveSearch({
      activeSearchId: activeSearch.id,
      projectId: eitapiToken.project_id,
      environmentId: eitapiToken.environment_id,
      groupId: eitapiToken.group_id,
      updatedFields: {
        nextToken,
        nextStartTime,
      },
    });
  }

  const response: any = {
    events: results.events,
  };
  if (nextToken) {
    response.next = nextToken;
  }

  return {
    status: 200,
    body: JSON.stringify(response),
  };
}
