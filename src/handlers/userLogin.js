import * as bcrypt from "bcryptjs";

import getUser from "../models/user/get";
import createAdminsession from "../models/adminsession/create";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    let user;
    getUser({
      email: req.body.email,
    })
      .then((u) => {
        if (!u) {
          reject({ status: 401, err: new Error("Unauthorized") });
          return;
        }

        user = u;
        return validatePassword(u.password_crypt, req.body.password);
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 401, err: new Error("Unauthorized") });
          return;
        }
        return createAdminsession({
          user,
        });
      })
      .then((token) => {
        const response = {
          user: {
            email: user.email,
            id: user.id,
          },
          token,
        };
        resolve({
          status: 200,
          body: JSON.stringify(response),
        });
      })
      .catch(reject);
  });
};

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
