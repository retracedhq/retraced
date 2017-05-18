import * as moment from "moment";

export interface DeletionRequestValues {
  backoffInterval?: number;
  resourceKind: "environment";
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
    backoffInterval: row.backoff_interval,
    resourceKind: row.resource_kind,
    resourceId: row.resource_id,
  };
}

export function rowFromDeletionRequest(dr: DeletionRequest): any {
  return {
    id: dr.id,
    created: dr.created.unix(),
    backoff_interval: dr.backoffInterval || null,
    resource_kind: dr.resourceKind,
    resource_id: dr.resourceId,
  };
}
