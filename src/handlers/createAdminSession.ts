import * as Auth0 from "auth0-js";
import { LocalStorage } from "node-localstorage";
import * as util from "util";
import * as jwt from "jsonwebtoken";

import getUser from "../models/user/get";
import createUser, { DUPLICATE_EMAIL } from "../models/user/create";
import getInvite from "../models/group/invite/get";
import deleteInvite from "../models/group/invite/delete";
import addUserToProject from "../models/project/addUser";
import { createAdminVoucher } from "../security/vouchers";

const auth0 = new Auth0.WebAuth({
  domain: process.env.AUTH0_CLIENT_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  callbackURL: "",
});

// This is to appease the Auth0 lib, which expects to be running in a browser. -_-
global["window"] = {
  localStorage: new LocalStorage("./auth0"),
};

export default async function handler(req) {
  if (!req.body.external_auth) {
    throw { status: 400, err: new Error("Missing required auth") };
  }

  const externalAuth = await validateExternalAuth(req.body.external_auth);

  let user = await getUser({
    email: externalAuth.email,
    authId: externalAuth.upstreamToken,
  });
  if (!user) {
    try {
      user = await createUser({
        email: externalAuth.email,
        authId: externalAuth.upstreamToken,
      });
    } catch (err) {
      if (err === DUPLICATE_EMAIL) {
        throw { status: 409, err: new Error("Email already exists") };
      }
      throw err;
    }
  }

  let invite;
  if (externalAuth.inviteId) {
    // This login attempt is the direct result of someone following an invitation link.
    // This means we can look up the invitation directly by its id.
    // Ergo, this user can register with any e-mail address provided to us by Auth0.
    invite = await getInvite({ inviteId: externalAuth.inviteId });
  } else {
    // Otherwise, we still check to see if this email has a pending invite, just in case.
    invite = await getInvite({ email: externalAuth.email });
  }

  if (invite) {
    console.log(`Found invite for user: ${externalAuth.email} / ${externalAuth.upstreamToken}, adding them to project '${invite.project_id}'`);
    await addUserToProject({
      userId: user.id,
      projectId: invite.project_id,
    });
    await deleteInvite(invite.id);
  }

  const voucher = createAdminVoucher({
    userId: user.id,
  });

  const response = {
    user: {
      email: user.email,
      id: user.id,
    },
    token: voucher,
  };

  return {
    status: 200,
    body: JSON.stringify(response),
  };
}

interface ExternalAuth {
  email: string;
  upstreamToken: string;
  inviteId?: string;
}

function validateExternalAuth(payload: string): Promise<ExternalAuth> {
  return new Promise<ExternalAuth>((resolve, reject) => {
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
