import searchQueryParser from "search-query-parser";
import moment from "moment";
import _ from "lodash";

export interface Group {
  id: string;
  name?: string;
}

export interface Actor {
  id: string;
  name?: string;
  href?: string;
}

export interface Target {
  id: string;
  name: string;
  href?: string;
  type?: string;
}

export interface EventFields {
  [key: string]: string;
}

export type crud = "c" | "r" | "u" | "d";

export interface RetracedEvent {
  id?: string;
  action: string;
  group?: Group;
  display_title?: string;
  created?: number;
  actor?: Actor;
  target?: Target;
  crud?: crud;
  sourceIp?: string;
  description?: string;
  isAnonymous?: boolean;
  isFailure?: boolean;
  fields?: EventFields;
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
    sourceIp: eventInput["source_ip"],
    description: eventInput["description"],
    isAnonymous: eventInput["is_anonymous"],
    isFailure: eventInput["is_failure"],
    fields: eventInput["fields"],
    component: eventInput["component"],
    version: eventInput["version"],
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
    text?: string;
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
];

// result from search-query-parser lib if keywords found
interface SQP {
    action?: string | string[];
    crud?: string | string[];
    received?: string | string[];
    created?: string | string[];
    actor_id?: string | string[];
    actor_name?: string | string[];
    description?: string | string[];
    location?: string | string[];
    text?: string;
}

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
        throw { status: 400, err: new Error("The received field requires a range of two datetimes.")};
    }

    const range = (input as [string, string]).map((datetime) => moment.utc(datetime));
    range.forEach((m) => {
        if (!m.isValid()) {
            throw { status: 400, err: new Error(`Cannot parse received datetime ${range[0]}`) };
        }
    });

    return range.map((m) => m.valueOf()) as [number, number];
}
