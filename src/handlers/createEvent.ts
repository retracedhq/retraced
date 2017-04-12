import * as _ from "lodash";
import * as chalk from "chalk";
import * as moment from "moment";
import * as pg from "pg";
import * as util from "util";
import * as uuid from "uuid";
import * as express from "express";
import { instrumented } from "monkit";

import createCanonicalHash from "../models/event/canonicalize";
import Event from "../models/event/";
import { fromCreateEventInput } from "../models/event";
import getApiToken from "../models/api_token/get";
import uniqueId from "../models/uniqueId";
import { apiTokenFromAuthHeader } from "../security/helpers";
import { default as getDisque, DisqueClient } from "../persistence/disque";
import getPgPool from "../persistence/pg";

const requiredFields = [
  "action",
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

/**
 * @swagger
 * definitions:
 *   CreateEventResult:
 *     properties:
 *       id:
 *         type: string
 *       hash:
 *         type: string
 */
interface CreateEventResult {
  id: string;
  hash: string;
}

/**
 * @swagger
 * /publisher/v1/project/:projectId/event:
 *   post:
 *     tags:
 *       - event
 *       - create
 *       - publisher
 *     description: Create a new event
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: The created event id and a canonical hash of event fields
 *         schema:
 *           $ref: '#/definitions/CreateEventResult'
 */
export class EventCreater {

  public static readonly insertIntoIngestTask = `
      insert into ingest_task (
        id, original_event, project_id, environment_id, new_event_id, received
      ) values (
        $1, $2, $3, $4, $5,
        to_timestamp($6::double precision / 1000)
      )`;

  private readonly pgPool: pg.Pool;
  private readonly disque: DisqueClient;
  private readonly hasher: (event: Event) => string;
  private readonly idSource: () => string;

  constructor(
    pgPool: pg.Pool,
    disque: DisqueClient,
    hasher: (event: Event) => string,
    idSource: () => string,
  ) {
    this.pgPool = pgPool;
    this.disque = disque;
    this.hasher = hasher;
    this.idSource = idSource;
  }

  @instrumented
  public async createEvent(req: express.Request): Promise<any> {
    const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
    const apiToken: any = await getApiToken(apiTokenId, this.pgPool.query.bind(this.pgPool));
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
        this.validateEventInput(eventInput);
      } catch (validationError) {
        throw {
          status: 400,
          err: new Error(`Invalid event input at index ${index}: ${validationError.message}`),
        };
      }
    });

    // This is what will be returned to the caller.
    let results: CreateEventResult[] = [];

    // Create a new ingestion task for each event passed in.
    for (const eventInput of eventInputs) {
      const insertStmt = EventCreater.insertIntoIngestTask;

      const newTaskId = this.idSource();
      const newEventId = this.idSource();
      const insertVals = [
        newTaskId,
        JSON.stringify(eventInput),
        apiToken.project_id,
        apiToken.environment_id,
        newEventId,
        moment().valueOf(),
      ];

      await this.pgPool.query(insertStmt, insertVals);

      const job = JSON.stringify({
        taskId: newTaskId,
      });
      const opts = {
        retry: 600, // seconds
        async: false,
      };
      // This task will normalize the event and save its important bits to postgres.
      // It'll then enqueue tasks for saving to the other databases.
      this.disque.addjob("normalize_event", job, 2000, opts)
        .then((res) => {
          console.log(`sent task ${job} to normalize_event, received ${res}`);
        })
        .catch((err) => {
          console.log(`failed to send task ${job} to normalize_event: ${chalk.red(util.inspect(err))}`);
        });

      // Coerce the input event into a proper Event object.
      // Then, generate an authoritative hash from its contents.
      // This will be returned to the caller.
      const event = fromCreateEventInput(eventInput, newEventId);
      results.push({
        id: newEventId,
        hash: this.hasher(event),
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
    if (!_.isEmpty(maybeEvent["crud"]) && _.indexOf(possibleCrudValues, maybeEvent["crud"]) < 0) {
      throw new Error(`Invalid value for 'crud' field: ${maybeEvent["crud"]}`);
    }

  }
}

const creater = new EventCreater(
  getPgPool(),
  getDisque(),
  createCanonicalHash,
  uniqueId,
);

export default async function handle(req: express.Request): Promise<any> {
  return creater.createEvent(req);
}
