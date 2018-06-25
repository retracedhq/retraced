import "source-map-support/register";
import * as process from "process";
import * as moment from "moment";

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
