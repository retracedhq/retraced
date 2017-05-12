
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

export interface Fields {
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
  fields?: Fields;
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
