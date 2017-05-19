<<<<<<< HEAD
export interface User {
    id: string;
    created?: Date;
    email: string;
    last_login?: Date;
    timezone: string;
    tx_email_recipient?: boolean; // backwards compat
    txEmailRecipient?: boolean;
    external_auth_id?: string; // backwards compat
    externalAuthId?: string;
    // etc but I'm in a hurry
}

export function userFromRow(row: any) {
    const {
        id,
        created,
        email,
        external_auth_id,
        timezone,
        tx_email_recipient,
        last_login,
        password_crypt,
    } = row;
    return {
        id,
        created,
        email,
        timezone,
        last_login,
        external_auth_id,
        externalAuthId: external_auth_id,
        tx_email_recipient,
        txEmailRecipient: tx_email_recipient,
        password_crypt,
    };
=======
import * as moment from "moment";

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
>>>>>>> Add deletion confirmation creation
}
