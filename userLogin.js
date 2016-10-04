'use strict';

const bcrypt = require('bcryptjs');

const getUser = require('./lib/models/user/get');
const createAdminsession = require('./lib/models/adminsession/create');

module.exports.default = (event, context, cb) => {
  let user;
  getUser({
    email: event.body.email,
  })
  .then((u) => {
    if (!u) {
      cb(new Error('[401] Unauthorized'));
      return;
    }

    user = u;
    return validatePassword(u.password_crypt, event.body.password);
  })
  .then((valid) => {
    if (!valid) {
      cb(new Error('[401] Unauthorized'));
      return;
    }
    return createAdminsession({
      user,
    });
  })
  .then((token) => {
    let response = {
      user: {
        email: user.email,
        id: user.id,
      },
      token,
    };
    cb(null, response);
  })
  .catch((err) => {
    cb(err);
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

