import * as _ from "lodash";
import * as chalk from "chalk";
import * as moment from "moment";
import * as pg from "pg";
import * as util from "util";
import * as uuid from "uuid";
import * as express from "express";
import { instrumented } from "monkit";
import { Get, Post, Route, Body, Query, Header, Path, SuccessResponse, Controller } from "tsoa";

import createCanonicalHash from "../models/event/canonicalize";
import Event, { Fields, crud } from "../models/event/";
import { fromCreateEventInput } from "../models/event";
import getApiToken from "../models/api_token/get";
import uniqueId from "../models/uniqueId";
import { apiTokenFromAuthHeader } from "../security/helpers";
import { NSQClient } from "../persistence/nsq";
import getPgPool from "../persistence/pg";

const requiredFields = [
  "action",
  "crud",
];

const possibleCrudValues = [
  "c", "r", "u", "d",
];

const requiredSubfields = [
  // group, if present, must include group.id
  ["group", "group.id"],
  // actor, if present, must include actor.id
  ["actor", "actor.id"],
  // target, if present, must include target.id
  ["target", "target.id"],
];

/** A group is a single organization that is an end customer of a vendor app */
export interface RequestGroup {
  /** The id of this group in the vendor app's data model  */
  id?: string;
  /** A human-readable name */
  name?: string;
}

/** An actor is the person or identity (like an API token) that performed the action */
export interface RequestActor {
  /** The id of this actor in the vendor app's data model  */
  id?: string;
  /** A human-readable name */
  name?: string;
  /** A url to view this actor in the vendor app.
   * Can be referenced in Retraced [Display Templates](https://preview.retraced.io/documentation/advanced-retraced/display-templates/)
   * to create an interactive embedded viewer experience.
   */
  href?: string;
}

/** A target is the object upon which the action is performed */
export interface RequestTarget {
  /** The id of this target in the vendor app's data model  */
  id?: string;
  /** A human-readable name */
  name?: string;
  /** A url to view this target in the vendor app.
   * Can be referenced in Retraced
   * to create an interactive embedded viewer experience.
   */
  href?: string;
  /** Identifies the type */
  type?: string;
}

export interface CreateEventRequest {
  /** The action that occured e.g. `user.login` or `spreadsheet.create` */
  action: string;
  /** Denotes whether this is a "Create", "Read", "Update", or "Delete" event. */
  crud: crud;
  group?: RequestGroup;
  /** A title to display for the event.
   *  This field is deprecated in favor of [Display Templates](https://preview.retraced.io/documentation/advanced-retraced/display-templates/)
   */
  displayTitle?: string;
  /** milliseconds since the epoch that this event occurent. `created` will be tracked in addtion to `received` */
  created?: number;
  actor?: RequestActor;
  target?: RequestTarget;
  /** The source IP address from which the event was initiated */
  source_ip?: string;
  /** A human-readable description of the event */
  description?: string;
  /** Denotes whether this event was anonymous. Must be `true` if `actor` is absent */
  is_anonymous?: boolean;
  /** Denotes whether this event represents a failure to perform the action */
  is_failure?: boolean;
  /** An optional set of additional arbitrary event about the data */
  fields?: Fields;
  /** An identifier for the vendor app component that sent the event */
  component?: string;
  /** An identifier for the version of the vendor app that sent the event, usually a git SHA */
  version?: string;
}

export interface CreateEventResponse {
  id: string;
  hash: string;
}

export class EventCreater {

  public static readonly insertIntoIngestTask = `
      insert into ingest_task (
        id, original_event, project_id, environment_id, new_event_id, received
      ) values (
        $1, $2, $3, $4, $5,
        to_timestamp($6::double precision / 1000)
      )`;

  private readonly pgPool: pg.Pool;
  private readonly nsq: NSQClient;
  private readonly hasher: (event: Event) => string;
  private readonly idSource: () => string;

  constructor(
    pgPool: pg.Pool,
    nsq: NSQClient,
    hasher: (event: Event) => string,
    idSource: () => string,
  ) {
    this.pgPool = pgPool;
    this.nsq = nsq;
    this.hasher = hasher;
    this.idSource = idSource;
  }

  public async createEventRaw(req: express.Request): Promise<any> {
    return this.createEvent(req.get("Authorization"), req.params.projectId, req.body);
  }
  @instrumented
  public async createEvent(authorization: string, projectId: string, body: CreateEventRequest): Promise<any> {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, this.pgPool.query.bind(this.pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;
    if (!validAccess) {
      throw { status: 401, err: new Error("Unauthorized") };
    }

    const eventInputs = [body];

    // TODO(zhaytee): If an array of events is being submitted, allow valid ones to continue through?
    // Currently, this rejects the entire call if a single event fails validation.
    eventInputs.forEach((eventInput, index) => {
      try {
        this.validateEventInput(eventInput);
      } catch (validationError) {
        throw {
          status: 400,
          err: new Error(`Invalid event input at index ${index}: ${validationError.message}`),
        };
      }
    });

    // This is what will be returned to the caller.
    let results: CreateEventResponse[] = [];

    // Create a new ingestion task for each event passed in.
    for (const eventInput of eventInputs) {
      const result = await this.saveRawEvent(
        apiToken.project_id,
        apiToken.environment_id,
        eventInput,
      );
      results.push(result);
    }

    const responseBody = JSON.stringify(results[0]);

    return {
      status: 201,
      body: responseBody,
    };
  }

  public async saveRawEvent(projectId: string, envId: string, eventInput: CreateEventRequest) {
    const insertStmt = EventCreater.insertIntoIngestTask;

    const newTaskId = this.idSource();
    const newEventId = this.idSource();
    const insertVals = [
      newTaskId,
      JSON.stringify(eventInput),
      projectId,
      envId,
      newEventId,
      moment().valueOf(),
    ];

    await this.pgPool.query(insertStmt, insertVals);

    const job = JSON.stringify({
      taskId: newTaskId,
    });
    this.nsq.produce("raw_events", job)
      .then((res) => {
        console.log(`sent task ${job} to raw_events`);
      })
      .catch((err) => {
        console.log(`failed to send task ${job} to raw_events: ${chalk.red(util.inspect(err))}`);
      });

    // Coerce the input event into a proper Event object.
    // Then, generate an authoritative hash from its contents.
    // This will be returned to the caller.
    const event = fromCreateEventInput(eventInput, newEventId);

    return {
      id: newEventId,
      hash: this.hasher(event),
    };
  }

  /**
   *
   *   request input shape
   *   -------------------
   *   {
   *    action: string;
   *    group?: {
   *      id: string;
   *      name?: string;
   *    };
   *    created?: string;
   *    crud?: "c" | "r" | "u" | "d";
   *    actor?: {
   *      id: string;
   *      name?: string;
   *      href?: string;
   *    };
   *    target?: {
   *      id: string;
   *      name?: string;
   *      href?: string;
   *    };
   *    source_ip?: string;
   *    is_anonymous?: boolean;
   *    is_failure?: boolean;
   *    fields?: {[key: string]: string};
   *   }
   */
  private validateEventInput(maybeEvent: any) {
    for (const fieldName of requiredFields) {
      if (_.isEmpty(_.get(maybeEvent, fieldName))) {
        throw new Error(`Missing required field '${fieldName}'`);
      }
    }

    for (const [field, requiredSubfield] of requiredSubfields) {
      const hasField = !_.isEmpty(_.get(maybeEvent, field));
      const missingSubfield = hasField && _.isEmpty(_.get(maybeEvent, requiredSubfield));
      if (missingSubfield) {
        throw new Error(`Field '${requiredSubfield}' is required if '${field}' is present`);
      }
    }

    // If not marked as anonymous, actor data must be present
    if (!maybeEvent.is_anonymous) {
      if (_.isEmpty(_.get(maybeEvent, "actor"))) {
        throw new Error(`Event is not marked anonymous, and missing required field 'actor'`);
      }
    }

    // created timestamp, if present, must be parseable
    if (!_.isEmpty(maybeEvent["created"]) && !moment(maybeEvent["created"]).isValid()) {
      throw new Error(`Unable to parse 'created' field as valid time: ${maybeEvent["created"]}`);
    }

    // crud field, if present, must contain a valid value
    if (_.indexOf(possibleCrudValues, maybeEvent["crud"]) < 0) {
      throw new Error(`Invalid value for 'crud' field: ${maybeEvent["crud"]}`);
    }

  }
}

export const defaultEventCreater = new EventCreater(
  getPgPool(),
  NSQClient.fromEnv(),
  createCanonicalHash,
  uniqueId,
);

export default async function handle(req: express.Request): Promise<any> {
  return defaultEventCreater.createEventRaw(req);
}
