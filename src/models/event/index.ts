import searchQueryParser from "search-query-parser";
import moment from "moment";
import _ from "lodash";
import { EventInternal } from "@retracedhq/retraced";

export { EventFields } from "@retracedhq/retraced";

export interface RetracedEvent extends EventInternal {
  id?: string;
  created?: number;
  component?: string;
  version?: string;
}

export default RetracedEvent;

export function fromCreateEventInput(eventInput: any, newEventId: string): RetracedEvent {
  return {
    id: newEventId,
    action: eventInput["action"],
    group: eventInput["group"],
    created: eventInput["created"],
    actor: eventInput["actor"],
    target: eventInput["target"],
    crud: eventInput["crud"],
    source_ip: eventInput["source_ip"],
    description: eventInput["description"],
    is_anonymous: eventInput["is_anonymous"],
    is_failure: eventInput["is_failure"],
    fields: eventInput["fields"],
    component: eventInput["component"],
    version: eventInput["version"],
    external_id: eventInput["external_id"],
    metadata: eventInput["metadata"],
  };
}

export interface ActionQuery {
  term: string;
  isPrefix: boolean;
}

export interface ParsedQuery {
  actions?: ActionQuery[];
  crud?: string[];
  received?: [number, number];
  created?: [number, number];
  actor_id?: string[];
  actor_name?: string[];
  description?: string[];
  location?: string[];
  external_id?: string[];
  text?: string;
  target_id?: string[];
  target_name?: string[];
  target_type?: string[];
}

const structuredQueryKeywords = [
  "action",
  "crud",
  "received",
  "created",
  "actor.id",
  "actor.name",
  "description",
  "location",
  "external_id",
  "fields.*",
];

function toArray(x: string | string[]): string[] {
  return Array.isArray(x) ? x : [x];
}

export function parseQuery(query: string): ParsedQuery {
  const options = { keywords: structuredQueryKeywords };
  const intermediate: string | searchQueryParser.SearchParserResult = searchQueryParser.parse(query, options);

  if (_.isString(intermediate)) {
    return {
      text: intermediate,
    };
  }

  const parsed: ParsedQuery = _.pick(intermediate, ["text"]) as ParsedQuery;

  if (intermediate.action) {
    if (_.isString(intermediate.action)) {
      intermediate.action = [intermediate.action];
    }
    parsed.actions = _.map(intermediate.action, (action: string) => {
      if (_.endsWith(action, "*")) {
        return {
          term: _.trimEnd(action, "*"),
          isPrefix: true,
        };
      }
      return {
        term: action,
        isPrefix: false,
      };
    });
  }
  if (intermediate.crud) {
    parsed.crud = toArray(intermediate.crud);
  }
  if (intermediate.description) {
    parsed.description = toArray(intermediate.description);
  }
  if (intermediate.location) {
    parsed.location = toArray(intermediate.location);
  }
  if (intermediate["actor.id"]) {
    parsed.actor_id = toArray(intermediate["actor.id"]);
  }
  if (intermediate["actor.name"]) {
    parsed.actor_name = toArray(intermediate["actor.name"]);
  }
  if (intermediate["external_id"]) {
    parsed.external_id = toArray(intermediate["external_id"]);
  }

  if (intermediate.created) {
    parsed.created = scrubDatetimeRange(intermediate.created);
  }
  if (intermediate.received) {
    parsed.received = scrubDatetimeRange(intermediate.received);
  }

  return parsed;
}

function scrubDatetimeRange(input: string | string[]): [number, number] {
  if (!Array.isArray(input) || input.length !== 2) {
    throw {
      status: 400,
      err: new Error("The received field requires a range of two datetimes."),
    };
  }

  const range = (input as [string, string]).map((datetime) => moment.utc(datetime));
  range.forEach((m) => {
    if (!m.isValid()) {
      throw {
        status: 400,
        err: new Error(`Cannot parse received datetime ${JSON.stringify(range[0])}`),
      };
    }
  });

  return range.map((m) => m.valueOf()) as [number, number];
}
