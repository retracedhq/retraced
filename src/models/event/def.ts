import Actor from "../actor/def";
import Target from "../target/def";
import Group from "../group/def";

interface Event {
  id: string;
  action: string;
  group: Group;

  created?: number;
  actor?: Actor;
  target?: Target;
  crud?: "c" | "r" | "u" | "d";
  sourceIp?: string;
  description?: string;
  isAnonymous?: boolean;
  isFailure?: boolean;
  fields?: { [key: string]: string };
}

export default Event;

export function fromCreateEventInput(eventInput: any, newEventId: string): Event {
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
  };
}
