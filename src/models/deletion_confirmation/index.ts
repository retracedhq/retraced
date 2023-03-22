import moment from "moment";
import { RetracedUser } from "../user";

export interface DeletionConfirmationValues {
  deletionRequestId: string;
  retracedUserId: string;
  received?: moment.Moment;
  visibleCode: string;
}

export interface DeletionConfirmation extends DeletionConfirmationValues {
  id: string;
}

export interface DeletionConfirmationHydrated extends DeletionConfirmation {
  retracedUser: RetracedUser | null;
}

export interface DeletionConfirmationSanitized {
  id: string;
  userId: string;
  email: string;
  approved: boolean;
}

export function deletionConfirmationFromRow(row: any): DeletionConfirmation {
  return {
    id: row.id,
    deletionRequestId: row.deletion_request_id,
    retracedUserId: row.retraceduser_id,
    received: row.received ? moment(+row.received) : undefined,
    visibleCode: row.visible_code,
  };
}

export function rowFromDeletionConfirmation(dc: DeletionConfirmation): any {
  return {
    id: dc.id,
    deletion_request_id: dc.deletionRequestId,
    retraceduser_id: dc.retracedUserId,
    received: dc.received ? dc.received.unix() : null,
    visible_code: dc.visibleCode,
  };
}
