import moment from "moment";

export interface InviteValues {
  email: string;
}

export interface Invite extends InviteValues {
  id: string;
  project_id: string;
  created: moment.Moment;
}

export interface InviteResponse {
  id: string;
  project_id: string;
  email: string;
  created: string;
}

export function responseFromInvite(invite: Invite): InviteResponse {
  return {
    id: invite.id,
    project_id: invite.project_id,
    email: invite.email,
    created: invite.created.format(),
  };
}

export function parseInvite(invite: any): Invite {
  return {
    id: invite.id,
    project_id: invite.project_id,
    email: invite.email,
    created: moment(+invite.created),
  };
}
