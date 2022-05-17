import moment from "moment";

export interface ApiTokenValues {
  disabled: boolean;
  name: string;
}

export interface ApiToken extends ApiTokenValues {
  token: string;
  created: moment.Moment;
  environmentId: string;
  projectId: string;
  readAccess: boolean;
  writeAccess: boolean;
}

export interface ApiTokenResponse {
  token: string;
  project_id: string;
  environment_id: string;
  disabled: boolean;
  name: string;
  created: string;
}

export function responseFromApiToken(t: ApiToken): ApiTokenResponse {
  return {
    project_id: t.projectId,
    environment_id: t.environmentId,
    token: t.token,
    disabled: t.disabled,
    name: t.name,
    created: t.created.toISOString(),
  };
}

export function apiTokenFromRow(row: any): ApiToken {
  return {
    token: row.token,
    created: moment(row.created),
    // ah javascript, how do i love thee...
    disabled: row.disabled !== undefined && row.disabled !== null && row.disabled,
    name: row.name,
    environmentId: row.environment_id,
    projectId: row.project_id,
    readAccess: row.read_access,
    writeAccess: row.write_access,
  };
}

export function rowFromApiToken(t: ApiToken): any {
  return {
    token: t.token,
    created: t.created.unix(),
    disabled: t.disabled,
    name: t.name,
    environment_id: t.environmentId,
    project_id: t.projectId,
    read_access: t.readAccess,
    write_access: t.writeAccess,
  };
}
