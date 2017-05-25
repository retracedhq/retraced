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
}
