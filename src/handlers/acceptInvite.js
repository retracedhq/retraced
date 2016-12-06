import "datejs";
import * as _ from "lodash";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

import acceptInvite from "../models/team/invite/accept";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    hashPassword(req.body.password)
      .then((hashedPassword) => {
        return acceptInvite(req.body.invitation_id, hashedPassword);
      })
      .then((user) => {
        return createSession(user);
      })
      .then((response) => {
        resolve(response);
      })
      .catch(reject);
  });
};

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
        return;
      }

      bcrypt.hash(password, salt, (bcryptErr, hash) => {
        if (bcryptErr) {
          reject(bcryptErr);
          return;
        }

        resolve(hash);
      });
    });
  });
}

function createSession(user) {
  return new Promise((resolve, reject) => {
    const response = {
      user: {
        email: user.email,
        id: user.id,
      },
      token: null,
    };

    const claims = {
      user_id: user.id,
      expiry: Date.today().add(21).days(),
    };

    response.token = jwt.sign(claims, process.env.HMAC_SECRET_ADMIN);
    resolve(response);
  });
}
