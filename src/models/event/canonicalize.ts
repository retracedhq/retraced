import Event from "./";
import { EventInternal, computeHash } from "../../_lib/index";

// Produces a canonical hash string representation of an event.
// See the Swagger spec for more details.
export default function (event: Event): string {
  return computeHash(event as EventInternal, event.id as string).hashResult;
}
