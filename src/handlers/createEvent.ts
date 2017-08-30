import * as _ from "lodash";
import * as moment from "moment";
import * as pg from "pg";
import * as pgFormat from "pg-format";
import * as util from "util";
import { instrument, instrumented } from "monkit";

import createCanonicalHash from "../models/event/canonicalize";
import Event, { Fields, crud } from "../models/event/";
import { fromCreateEventInput } from "../models/event";
import uniqueId from "../models/uniqueId";
import { NSQClient } from "../persistence/nsq";
import getPgPool, { Querier } from "../persistence/pg";
import Authenticator from "../security/Authenticator";
import { log } from "../logger";

const IP_REGEX = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;

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
  /** ISO8601 date string representing when this event occurent. `created` will be tracked in addtion to `received` */
  created?: Date;
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
  constructor(
    private readonly pgPool: pg.Pool,
    private readonly nsq: NSQClient,
    private readonly hasher: (event: Event) => string,
    private readonly idSource: () => string,
    private readonly authenticator: Authenticator,
    private readonly maxEvents: number,
  ) { }

  @instrumented
  public async createEvent(authorization: string, projectId: string, event: CreateEventRequest): Promise<CreateEventResponse> {
    const apiToken = await this.authenticator.getApiTokenOr401(authorization, projectId);
    this.validateEventInput(event);
    return await this.saveRawEvent(apiToken.projectId, apiToken.environmentId, event);
  }

  @instrumented
  public async createEventBulk(authorization: string, projectId: string, eventInputs: CreateEventRequest[]): Promise<CreateEventResponse[]> {
    const apiToken = await this.authenticator.getApiTokenOr401(authorization, projectId);
    this.validateEventInputs(eventInputs);

    const received = moment().format();

    const events = eventInputs.map((eventInput) => {
      const newTaskId = this.idSource();
      const newEventId = this.idSource();

      const values = [
        newTaskId,
        JSON.stringify(eventInput),
        apiToken.projectId,
        apiToken.environmentId,
        newEventId,
        received,
      ];

      return {
        id: newEventId,
        hash: this.hasher(fromCreateEventInput(eventInput, newEventId)),
        taskId: newTaskId,
        values,
      };
    });

    const query = pgFormat(`
      insert into ingest_task (
        id, original_event, project_id, environment_id, new_event_id, received
      ) values %L`, events.map(({ values }) => values));

    const pgConn: any = await instrument("PgPool.connect", this.pgPool.connect.bind(this.pgPool));

    try {
      await instrument("EventCreater.insertMany", async () => {
        return await pgConn.query(query);
      });
    } finally {
      pgConn.release();
    }

    events.forEach(this.nsqPublish.bind(this));

    return events.map(({ id, hash }) => ({ id, hash }));
  }

  /**
   * Save an event to postgres, and publish to nsq
   */
  public async saveRawEvent(projectId: string, envId: string, eventInput: CreateEventRequest, querier?: Querier): Promise<CreateEventResponse> {
    const { id, hash, taskId } = await this.saveEvent(projectId, envId, eventInput, querier);
    this.nsqPublish({ taskId });
    return { id, hash };
  }

  /**
   * Save an event to postgres, returning id, hash and the taskId to send to NSQ
   */
  @instrumented
  public async saveEvent(projectId: string, envId: string, eventInput: CreateEventRequest, querier?: Querier): Promise<{ id: string, hash: string, taskId: string }> {
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

    if (querier) {
      await querier.query(insertStmt, insertVals);
    } else {
      const conn: any = await instrument("PgPool.connect", this.pgPool.connect.bind(this.pgPool));

      try {
        await instrument("EventCreater.insertOne", async () => {
          return await conn.query(insertStmt, insertVals);
        });
      } finally {
        conn.release();
      }
    }

    // Coerce the input event into a proper Event object.
    // Then, generate an authoritative hash from its contents.
    // This will be returned to the caller.
    const event = fromCreateEventInput(eventInput, newEventId);

    return {
      id: newEventId,
      hash: this.hasher(event),
      taskId: newTaskId,
    };
  }

  private async nsqPublish({ taskId }) {
    const job = JSON.stringify({ taskId });
    return this.nsq.produce("raw_events", job)
      .then((res) => {
        log(`sent task ${job} to raw_events`);
      })
      .catch((err) => {
        log(`failed to send task ${job} to raw_events: ${(util.inspect(err))}`);
      });

  }

  private validateEventInputs(events: CreateEventRequest[]): void {
    const invalidEvents: any[] = [];

    if (events.length > this.maxEvents) {
      throw {
        status: 400,
        err: new Error(`A maximum of ${this.maxEvents} events may be created at once, received ${events.length}`),
      };
    }

    events.forEach((eventInput, index) => {
      const violations = this.validateEventInput(eventInput);
      if (!_.isEmpty(violations)) {
        invalidEvents.push({
          message: `Invalid event input at index ${index}:\n-- ${violations.map((i) => i.message).join("\n-- ")}`,
          index,
          violations,
        });
      }
    });

    if (!_.isEmpty(invalidEvents)) {
      throw {
        status: 400,
        err: new Error(`One or more invalid inputs, no events were logged:\n- ${invalidEvents.map((err) => err.message).join("\n- ")}`),
        invalid: invalidEvents,
      };
    }
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
  private validateEventInput(maybeEvent: CreateEventRequest): Violation[] {
    const violations: any[] = [];
    for (const fieldName of requiredFields) {
      if (_.isEmpty(_.get(maybeEvent, fieldName))) {
        violations.push({
          message: `Missing required field '${fieldName}'`,
          field: fieldName,
          violation: "missing",
        });
      }
    }

    for (const [field, requiredSubfield] of requiredSubfields) {
      const hasField = !_.isEmpty(_.get(maybeEvent, field));
      const missingSubfield = hasField && _.isEmpty(_.get(maybeEvent, requiredSubfield));
      if (missingSubfield) {
        violations.push({
          message: `Field '${requiredSubfield}' is required if '${field}' is present`,
          field: requiredSubfield,
          violation: "missing",
        });
      }
    }

    // If not marked as anonymous, actor data must be present
    if (!maybeEvent.is_anonymous) {
      if (_.isEmpty(_.get(maybeEvent, "actor"))) {
        violations.push({
          message: `Event is not marked anonymous, and missing required field 'actor'`,
          field: "actor",
          violation: "missing",
        });
      }
    }

    // created timestamp, if present, must be parseable
    if (!_.isEmpty(maybeEvent["created"]) && !moment(maybeEvent["created"]).isValid()) {
      violations.push({
        message: `Unable to parse 'created' field as valid time: ${maybeEvent["created"]}`,
        field: "created",
        received: maybeEvent.created,
        violation: "invalid",
      });
    }

    // crud field, if present, must contain a valid value
    if (_.indexOf(possibleCrudValues, maybeEvent["crud"]) < 0) {
      violations.push({
        message: `Invalid value for 'crud' field: ${maybeEvent["crud"]}`,
        field: "crud",
        received: maybeEvent.crud,
        violation: "invalid",
      });
    }

    if (maybeEvent.source_ip && !IP_REGEX.test(maybeEvent.source_ip)) {
      violations.push({
        message: `Unable to parse 'source_ip' field as valid IPV4 address: ${maybeEvent["source_ip"]}`,
        field: "source_ip",
        received: maybeEvent.source_ip,
        violation: "invalid",
      });
    }

    return violations;

  }
}

interface Violation {
  message: string;
  field: string;
  violation: string;
  received?: string;
}

export const defaultEventCreater = new EventCreater(
  getPgPool(),
  NSQClient.fromEnv(),
  createCanonicalHash,
  uniqueId,
  Authenticator.default(),
  Number(process.env.PUBLISHER_BULK_CREATE_MAX_EVENTS || "50"),
);
