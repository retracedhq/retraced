import moment from "moment";
import express from "express";

import { checkEitapiAccessUnwrapped } from "../../security/helpers";
import createSavedSearch, { Options } from "../../models/saved_search/create";
import { Responses } from "../../router";

export interface CreateSavedSearchRequest {
  /** `name` of this saved search */
  name: string;
  /** `actions` is an optional array of action ids to search over */
  actions?: string[];
  /** `actor_ids` is an optional array of actors to search over */
  actor_ids?: string[];
  /** `start` is an optional ISO8601 formatted date to search since */
  start?: Date;
}

export interface SavedSearch {
  /** `id` is the id of the saved search. Can be used to initiate an active search */
  id: string;
}

export default async function handler(req: express.Request) {
  return Responses.created(
    await createSavedSearchHandler(req.get("Authorization") || "", req.body)
  );
}

export async function createSavedSearchHandler(
  auth: string,
  body: CreateSavedSearchRequest
): Promise<SavedSearch> {
  const eitapiToken = await checkEitapiAccessUnwrapped(auth);
  if (!body.name) {
    throw {
      err: new Error("Missing required 'name' field"),
      status: 400,
    };
  }

  // Start time comes to us as an ISO 8601 string.
  let startTime;
  if (body.start) {
    const maybe = moment(body.start);
    if (maybe.isValid()) {
      startTime = maybe.unix();
    }
  }

  const opts: Options = {
    name: body.name,
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
    actions: body.actions,
    actorIds: body.actor_ids,
    startTime,
  };

  const newSavedSearch = await createSavedSearch(opts);

  return {
    id: newSavedSearch.id,
  };
}
