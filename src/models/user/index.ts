import moment from "moment";

export interface RetracedUserValues {
  email: string;
  lastLogin?: moment.Moment;
  externalAuthId?: string;
  timezone: string;
  txEmailsRecipient: boolean;
}

export interface RetracedUser extends RetracedUserValues {
  id: string;
  created: moment.Moment;
}

export interface RetracedUserResponse {
  id: string;
  email: string;
  timezone: string;
}

export function retracedUserFromRow(row: any): RetracedUser {
  return {
    id: row.id,
    created: moment(row.created),
    email: row.email,
    lastLogin: row.last_login ? moment(row.last_login) : undefined,
    externalAuthId: row.external_auth_id,
    timezone: row.timezone,
    txEmailsRecipient: row.tx_emails_recipient,
  };
}

export function rowFromRetracedUser(ru: RetracedUser): any {
  return {
    id: ru.id,
    created: ru.created.unix(),
    email: ru.email,
    last_login: ru.lastLogin ? ru.lastLogin.unix() : null,
    external_auth_id: ru.externalAuthId,
    timezone: ru.timezone,
    tx_emails_recipient: ru.txEmailsRecipient,
  };
}
