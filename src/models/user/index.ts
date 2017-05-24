export interface User {
    id: string;
    email: string;
    timezone: string;
    created?: Date;
    external_auth_id?: string; // backwards compat
    externalAuthId?: string;
    // etc but I'm in a hurry
}

export function userFromRow(row: any) {
    const { id, created, email, external_auth_id, timezone } = row;
    return {
        id,
        created,
        email,
        timezone,
        external_auth_id,
        externalAuthId: external_auth_id,
    };
}
