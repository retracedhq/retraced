import * as bcrypt from "bcryptjs";
import * as Auth0 from "auth0-js";
import { LocalStorage } from "node-localstorage";

import getUser from "../models/user/get";
import createAdminsession from "../models/adminsession/create";

const auth0 = new Auth0.WebAuth({
  domain: process.env.AUTH0_CLIENT_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
});

// This is to appease the Auth0 lib, which expects to be running in a browser. -_-
global.window = {
  localStorage: new LocalStorage("./auth0"),
};

export default async function handler(req) {
  let user;
  if (req.body.email) {
    user = await getUser({
      email: req.body.email,
    });
    if (!user) {
      throw { status: 401, err: new Error("Unauthorized") };
    }

    const pwValid = await validatePassword(user.password_crypt, req.body.password);
    if (!pwValid) {
      throw { status: 401, err: new Error("Unauthorized") };
    }
  } else if (req.body.external_auth) {
    const externalAuthId = await validateExternalAuth(req.body.external_auth);
    if (!externalAuthId) {
      throw { status: 401, err: new Error("Unauthorized") };
    }

    user = await getUser({
      externalAuthId,
    });
    if (!user) {
      throw { status: 401, err: new Error("Unauthorized") };
    }
  }

  const newJWT = await createAdminsession({ user });
  const response = {
    user: {
      email: user.email,
      id: user.id,
    },
    token: newJWT,
  };

  return {
    status: 200,
    body: JSON.stringify(response),
  };
}

function validatePassword(passwordCrypt, passwordPlain) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(passwordPlain, passwordCrypt, (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      if (res) {
        resolve(true);
        return;
      }

      resolve(false);
    });
  });
}

function validateExternalAuth(payload) {
  return new Promise((resolve, reject) => {
    auth0.parseHash({ hash: payload }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      // TODO(zhaytee): Perform more JWT validation
      resolve(data.idTokenPayload.sub);
    });
  });
}
