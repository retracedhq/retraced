'use strict';

const bcrypt = require('bcryptjs');

const getUser = require('./lib/models/user/get');
const createAdminsession = require('./lib/models/adminsession/create');

const handler = (event, context, cb) => {
  let user;
  getUser({
    email: event.body.email,
  })
  .then((u) => {
    if (!u) {
      throw new Error('[401] Unauthorized');
    }

    user = u;
    return validatePassword(u.password_crypt, event.body.password);
  })
  .then((valid) => {
    if (!valid) {
      throw new Error('[401] Unauthorized');
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

if (require('./lib/config/getConfig')().IOPipe.ClientID) {
  const iopipe = require('iopipe')({
    clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
  });

  module.exports.default = iopipe(handler);
} else {
  module.exports.default = handler;
}
