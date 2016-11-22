const _ = require("lodash");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("datejs");

const config = require("../config/getConfig")();
const acceptInvite = require("../models/team/invite/accept");

const handler = (req) => {
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

    response.token = jwt.sign(claims, config.Session.HMACSecret);
    resolve(response);
  });
}

module.exports = handler;
