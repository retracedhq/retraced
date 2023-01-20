import moment from "moment";
import { DeletionConfirmationSanitized } from "../deletion_confirmation";

export interface DeletionRequestValues {
  backoffInterval?: moment.Duration;
  resourceKind: string;
  resourceId: string;
}

export interface DeletionRequest extends DeletionRequestValues {
  id: string;
  created: moment.Moment;
}

export interface DeletionRequestHydrated extends DeletionRequest {
  deletionConfirmations: DeletionConfirmationSanitized[];
  expiration: moment.Moment;
}

export function deletionRequestFromRow(row: any): DeletionRequest {
  // Need to cast backoff_interval to Number because pg returns bigint columns as strings
  return {
    id: row.id,
    created: moment(row.created),
    backoffInterval: row.backoff_interval
      ? moment.duration(Number(row.backoff_interval), "seconds")
      : undefined,
    resourceKind: row.resource_kind,
    resourceId: row.resource_id,
  };
}

export function rowFromDeletionRequest(dr: DeletionRequest): any {
  return {
    id: dr.id,
    created: dr.created.unix(),
    backoff_interval: dr.backoffInterval
      ? dr.backoffInterval.asSeconds()
      : null,
    resource_kind: dr.resourceKind,
    resource_id: dr.resourceId,
  };
}

export const maxAge = moment.duration(1, "month");

export function deletionRequestHasExpired(request: DeletionRequest): boolean {
  return request.created.isBefore(moment().subtract(maxAge));
}

export function deletionRequestBackoffRemaining(
  request: DeletionRequest
): moment.Duration {
  let remaining = 0;
  if (request.backoffInterval) {
    const backoffEnds = request.created.clone().add(request.backoffInterval);
    remaining = Math.max(0, backoffEnds.diff(moment(), "seconds"));
  }
  return moment.duration(remaining, "seconds");
}
