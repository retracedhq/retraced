'use strict';

require('datejs');
const jwt = require('jsonwebtoken');

const config = require('../../config/getConfig')();

function createAdminsession(opts) {
  return new Promise((resolve, reject) => {
    // The token is the claims
    const claims = {
      user_id: opts.user.id,
      expiry: Date.today().add(21).days(),
    };

    resolve(jwt.sign(claims, config.Session.HMACSecret));
  });
}


module.exports = createAdminsession;
