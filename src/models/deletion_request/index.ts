import * as moment from "moment";

export interface DeletionRequestValues {
  backoffInterval?: moment.Duration;
  resourceKind: string;
  resourceId: string;
}

export interface DeletionRequest extends DeletionRequestValues {
  id: string;
  created: moment.Moment;
}

export function deletionRequestFromRow(row: any): DeletionRequest {
  return {
    id: row.id,
    created: moment(row.created),
    backoffInterval: row.backoff_interval ? moment.duration(row.backoff_interval, "seconds") : undefined,
    resourceKind: row.resource_kind,
    resourceId: row.resource_id,
  };
}

export function rowFromDeletionRequest(dr: DeletionRequest): any {
  return {
    id: dr.id,
    created: dr.created.unix(),
    backoff_interval: dr.backoffInterval ? dr.backoffInterval.asSeconds() : null,
    resource_kind: dr.resourceKind,
    resource_id: dr.resourceId,
  };
}

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// TODO(zhaytee): Promote this interface into a class...? D:

export function deletionRequestHasExpired(request: DeletionRequest): boolean {
  return request.created.isBefore(moment().subtract(1, "month"));
}

export function deletionRequestBackoffRemaining(request: DeletionRequest): moment.Duration | null {
  if (!request.backoffInterval) {
    return null;
  }

  const backoffFinished = request.created.add(request.backoffInterval);
  const remaining = backoffFinished.diff(request.created, "seconds");
  if (remaining <= 0) {
    return null;
  }

  return moment.duration(remaining, "seconds");
}
