'use strict';

const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('datejs')

const config = require('./lib/config/getConfig')();
const acceptInvite = require('./lib/models/team/invite/accept');

const iopipe = require('iopipe')({
  clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
});

module.exports.default = iopipe(
  (event, context, cb) => {
    hashPassword(event.body.password)
      .then((hashedPassword) => {
        return acceptInvite(event.body.invitation_id, hashedPassword);
      })
      .then((user) => {
        return createSession(user);
      })
      .then((response) => {
        cb(null, response);
      })
      .catch((err) => {
        console.log(err);
        cb(err);
      });
  }
);

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          console.log(err);
          reject(err);
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

