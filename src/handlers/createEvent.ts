import * as uuid from "uuid";
import * as _ from "lodash";
import * as moment from "moment";

import createCanonicalHash from "../models/event/canonicalize";
import { fromCreateEventInput } from "../models/event";
import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getDisque from "../persistence/disque";
import getPgPool from "../persistence/pg";

const disque = getDisque();
const pgPool = getPgPool();

interface CreateResult {
  id: string;
  hash: string;
}

export default async function handler(req) {
  const pg = await pgPool.connect();
  try {
    const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
    const apiToken: any = await getApiToken(apiTokenId);
    const validAccess = apiToken && apiToken.project_id === req.params.projectId;
    if (!validAccess) {
      throw { status: 401, err: new Error("Unauthorized") };
    }

    let eventInputs = req.body;
    if (!Array.isArray(req.body)) {
      eventInputs = [req.body];
    }

    // TODO(zhaytee): If an array of events is being submitted, allow valid ones to continue through?
    // Currently, this rejects the entire call if a single event fails validation.
    eventInputs.forEach((eventInput, index) => {
      try {
        validateEventInput(eventInput);
      } catch (validationError) {
        throw {
          status: 400,
          err: new Error(`Invalid event input at index ${index}: ${validationError.message}`),
        };
      }
    });

    // This is what will be returned to the caller.
    let results: CreateResult[] = [];

    // Create a new ingestion task for each event passed in.
    for (const eventInput of eventInputs) {
      const insertStmt = `
      insert into ingest_task (
        id, original_event, project_id, environment_id, new_event_id, received
      ) values (
        $1, $2, $3, $4, $5,
        to_timestamp($6::double precision / 1000)
      )`;

      const newTaskId = uuid.v4().replace(/-/g, "");
      const newEventId = uuid.v4().replace(/-/g, "");
      const insertVals = [
        newTaskId,
        JSON.stringify(eventInput),
        apiToken.project_id,
        apiToken.environment_id,
        newEventId,
        moment().valueOf(),
      ];

      await pg.query(insertStmt, insertVals);

      const job = JSON.stringify({
        taskId: newTaskId,
      });
      const opts = {
        retry: 600, // seconds
        async: true,
      };
      // This task will normalize the event and save its important bits to postgres.
      // It'll then enqueue tasks for saving to the other databases.
      disque.addjob("normalize_event", job, 0, opts);

      // Coerce the input event into a proper Event object.
      // Then, generate an authoritative hash from its contents.
      // This will be returned to the caller.
      const event = fromCreateEventInput(eventInput, newEventId);
      results.push({
        id: newEventId,
        hash: createCanonicalHash(event),
      });
    }

    // If request body wasn't an array, response body won't be either.
    let responseBody;
    if (Array.isArray(req.body)) {
      responseBody = JSON.stringify(results);
    } else if (results.length > 0) {
      responseBody = JSON.stringify(results[0]);
    }

    return {
      status: 201,
      body: responseBody,
    };

  } finally {
    pg.release();
  }
};

/*
request input shape
-------------------
{
  action: string;
  group: {
    id: string;
    name?: string;
  };
  created?: string;
  crud?: "c" | "r" | "u" | "d";
  actor?: {
    id: string;
    name?: string;
    href?: string;
  };
  target?: {
    id: string;
    name?: string;
    href?: string;
  };
  source_ip?: string;
  is_anonymous?: boolean;
  is_failure?: boolean;
  fields?: {[key: string]: string};
}
*/

const requiredGroupFields = [
  "group.id", "group.name",
];

const requiredActorFields = [
  "actor.id", "actor.name",
];

const requiredFields = [
  "action", ...requiredGroupFields,
];

const possibleCrudValues = [
  "c", "r", "u", "d",
];

function validateEventInput(maybeEvent: any) {
  for (const fieldName of requiredFields) {
    if (_.isEmpty(_.get(maybeEvent, fieldName))) {
      throw new Error(`Missing required field '${fieldName}'`);
    }
  }

  // If not marked as anonymous, actor data must be present
  if (!maybeEvent.is_anonymous) {
    for (const fieldName of requiredActorFields) {
      if (_.isEmpty(_.get(maybeEvent, fieldName))) {
        throw new Error(`Event is not marked anonymous, and missing required field '${fieldName}'`);
      }
    }
  }

  // created timestamp, if present, must be parseable
  if (!_.isEmpty(maybeEvent["created"]) && !moment(maybeEvent["created"]).isValid()) {
    throw new Error(`Unable to parse 'created' field as valid time: ${maybeEvent["created"]}`);
  }

  // crud field, if present, must contain a valid value
  if (!_.isEmpty(maybeEvent["crud"]) && _.indexOf(possibleCrudValues, maybeEvent["crud"]) < 0) {
    throw new Error(`Invalid value for 'crud' field: ${maybeEvent["crud"]}`);
  }
}
