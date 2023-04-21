import process from "process";
import moment from "moment";
import _ from "lodash";

export function jobDesc(job) {
  return job.id.substring(0, 8);
}

export function stopwatchClick(startTime: [number, number]): number {
  const diff = process.hrtime(startTime);
  return (diff[0] * 1e9 + diff[1]) / 1000000;
}

export function errToLog(err) {
  if (err.stack) {
    return err.stack;
  }
  return err;
}

export type Clock = () => moment.Moment;

export class TaskError extends Error {
  public retry: boolean;
}

// EnvironmentTimeRange is used with routines that collect metrics.
export interface EnvironmentTimeRange {
  projectId: string;
  environmentId: string;
  // TODO(areed) need to figure out how to make these Moment instances
  // half open interval [moment, moment)
  range: [any, any];
}

// Which timezone offsets will be at localHour during utcHour?
// Offsets range from -12:00 to +14:00. Does not include offsets within the
// hour such as -08:30.
// Example: For utcHour 18 and localTime 7, returns [-11, 13].
export function offsetsWithLocalTimeDuringUTCHour(utcHour: number, localHour: number) {
  const backOffset = localHour - utcHour;
  const forwardOffset = backOffset + 24;
  const validOffsets: number[] = [];

  if (backOffset >= -12) {
    validOffsets.push(backOffset);
  }
  if (forwardOffset <= 14) {
    validOffsets.push(forwardOffset);
  }

  return validOffsets;
}

/**
 * Restores the `original_event` using `compressed_event` and `normalized_event`
 */
export function restoreOriginalEvent(compressedEvent, normalizedEvent) {
  let originalEvent = _.pick(compressedEvent, [
    "action",
    "actor",
    "component",
    "created",
    "crud",
    "description",
    "external_id",
    "fields",
    "group",
    "is_anonymous",
    "is_failure",
    "metadata",
    "source_ip",
    "target",
    "version",
  ]);

  originalEvent = _.mapValues(originalEvent, (value, key) => {
    if (key === "actor") {
      return _.mapValues(value, (_value, _key) => {
        if (_key === "id") {
          return _.get(normalizedEvent, "actor.foreign_id");
        } else if (_key === "href") {
          return _.get(normalizedEvent, "actor.url");
        } else {
          return _.get(normalizedEvent, `actor.${_key}`);
        }
      });
    } else if (key === "target") {
      return _.mapValues(value, (_value, _key) => {
        if (_key === "id") {
          return _.get(normalizedEvent, "target.foreign_id");
        } else if (_key === "href") {
          return _.get(normalizedEvent, "target.url");
        } else {
          return _.get(normalizedEvent, `target.${_key}`);
        }
      });
    } else if (key === "group") {
      return _.mapValues(value, (_value, _key) => _.get(normalizedEvent, `group.${_key}`));
    } else if (key === "created") {
      return value;
    } else {
      return _.get(normalizedEvent, key);
    }
  });

  return originalEvent;
}
