import "datejs";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

import createUser from "../models/user/create";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    hashPassword(req.body.password)
      .then((hashed) => {
        return createUser({
          email: req.body.email,
          hashedPassword: hashed,
        });
      })
      .then((user) => {
        return createSession(user);
      })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        if (err === "DUPLICATE_EMAIL") {
          reject({ status: 409, err: new Error("Email Already Exists") });
          return;
        }
        reject(err);
      });
  });
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      bcrypt.hash(password, salt, (bcryptErr, hash) => {
        if (bcryptErr) {
          console.log(bcryptErr);
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
