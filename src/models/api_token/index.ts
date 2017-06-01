import * as moment from "moment";

export interface ApiTokenValues {
  disabled: boolean;
  name: string;
}

export interface ApiToken extends ApiTokenValues {
  token: string;
  created: moment.Moment;
  environmentId: string;
  projectId: string;
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
  };
}
