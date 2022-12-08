import Auth0 from "auth0-js";
import { LocalStorage } from "node-localstorage";
import _ from "lodash";
import { Event } from "@retraced-hq/retraced";

import getUser from "../models/user/getByExternalAuth";
import createUser, { ERR_DUPLICATE_EMAIL } from "../models/user/create";
import { RetracedUser } from "../models/user";
import getInvite from "../models/invite/get";
import { Invite } from "../models/invite";
import deleteInvite from "../models/invite/delete";
import addUserToProject from "../models/project/addUser";
import listProjects from "../models/project/list";
import { createAdminVoucher } from "../security/vouchers";
import { reportEvents } from "../headless";
import getPgPool from "../persistence/pg";
import { logger } from "../logger";
import config from "../config";

const pgPool = getPgPool();
let auth0;

if (config.AUTH0_CLIENT_DOMAIN && config.AUTH0_CLIENT_ID) {
  auth0 = new Auth0.WebAuth({
    domain: config.AUTH0_CLIENT_DOMAIN,
    clientID: config.AUTH0_CLIENT_ID,
    callbackURL: "",
    leeway: 30,
  });
}

// This is to appease the Auth0 lib, which expects to be running in a browser. -_-
global["window"] = {
  localStorage: new LocalStorage("./auth0"),
};

export default async function handler(req) {
  if (!req.body.external_auth) {
    throw { status: 400, err: new Error("Missing required auth") };
  }

  const externalAuth: ExternalAuth = await validateExternalAuth(
    req.body.external_auth
  );

  const result = await createSession(externalAuth);

  // Headless Audit Logs
  const projects = await listProjects({ user_id: result.user.id });
  const auditEvents: Event[] = projects.map((project) => ({
    action: "user.login",
    crud: "c",
    actor: {
      id: result.user.id,
    },
    group: {
      id: project.id,
    },
    sourceIp: req.ip,
  }));

  if (result.userIsNew && result.invite) {
    auditEvents.push({
      action: "user.create",
      crud: "c",
      actor: {
        id: result.user.id,
      },
      group: {
        id: result.invite.project_id,
      },
      target: {
        id: result.user.id,
        fields: {
          email: result.user.email,
        },
      },
      sourceIp: req.ip,
    });
  }
  if (result.invite) {
    auditEvents.push({
      action: "invite.accept",
      crud: "d",
      actor: {
        id: result.user.id,
      },
      target: {
        id: result.invite.id,
      },
      sourceIp: req.ip,
    });
  }

  await reportEvents(auditEvents);
  await result.commit();

  return {
    status: 200,
    user: _.pick(result.user, ["id", "email", "timezone"]),
    token: result.token,
  };
}

export interface CreateSessionResult {
  user: RetracedUser;
  invite?: Invite;
  token: string;
  userIsNew: boolean;
  commit: () => Promise<void>;
}

export async function createSession(
  externalAuth: ExternalAuth
): Promise<CreateSessionResult> {
  const pg = await pgPool.connect();
  const rollback = async () => {
    await pg.query("ROLLBACK");
    pg.release();
  };
  const result: any = {
    user: null,
    invite: null,
    jwt: "",
    userIsNew: false,
    commit: async () => {
      await pg.query("COMMIT");
      pg.release();
    },
  };

  await pg.query("BEGIN");

  try {
    result.user = await getUser({
      email: externalAuth.email,
      authId: externalAuth.upstreamToken,
    });
    if (!result.user) {
      try {
        result.user = await createUser({
          email: externalAuth.email,
          authId: externalAuth.upstreamToken,
        });
        result.userIsNew = true;
      } catch (err) {
        if (err === ERR_DUPLICATE_EMAIL) {
          throw { status: 409, err: new Error("Email already exists") };
        }
        throw err;
      }
    }

    // BUG: When login is initiated from the admin site, externalAuth.inviteId
    // contains a string, even when not following an invite link. This string is
    // not an invite ID.
    if (externalAuth.inviteId) {
      // This login attempt is the direct result of someone following an invitation link.
      // This means we can look up the invitation directly by its id.
      // Ergo, this user can register with any e-mail address provided to us by Auth0.
      result.invite = await getInvite({ inviteId: externalAuth.inviteId });
    }
    if (!result.invite) {
      // Otherwise, we still check to see if this email has a pending invite, just in case.
      result.invite = await getInvite({ email: externalAuth.email });
    }

    if (result.invite) {
      logger.info(
        `Found invite for user: ${externalAuth.email} / ${externalAuth.upstreamToken}, adding them to project '${result.invite.project_id}'`
      );
      await deleteInvite(
        {
          inviteId: result.invite.id,
          projectId: result.invite.project_id,
        },
        pg
      );

      // It's possible a user is invited to a project they're already on. If so delete result.invite.
      const userprojects = await listProjects({ user_id: result.user.id });

      if (
        _.some(
          userprojects,
          (project) => project.id === result.invite.project_id
        )
      ) {
        delete result.invite;
      } else {
        await addUserToProject(
          {
            userId: result.user.id,
            projectId: result.invite.project_id,
          },
          pg
        );
      }
    }

    result.token = createAdminVoucher({
      userId: result.user.id,
    });
  } catch (err) {
    rollback();
    throw err;
  }

  return result;
}

export interface ExternalAuth {
  email: string;
  upstreamToken: string;
  inviteId?: string;
}

function validateExternalAuth(payload: string): Promise<ExternalAuth> {
  return new Promise<ExternalAuth>((resolve, reject) => {
    if (!auth0) {
      reject("Auth0 not initialized, admin sessions not available");
      return;
    }
    auth0.parseHash({ hash: payload }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        email: data.idTokenPayload.email,
        upstreamToken: data.idTokenPayload.sub,
        inviteId: data.state,
      });
    });
  });
}
