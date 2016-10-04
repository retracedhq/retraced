'use strict';

const jwt = require('jsonwebtoken');

const config = require('../config/getConfig')();

/**
 * Asynchronously validates a JWT token from the event, and returns the claims.
 *
 * @param {Object} The request options
 */
function validateSession(opts) {
  return new Promise((resolve, reject) => {
    if (!opts.jwt_source) {
      reject(new Error('missing jwt_source parmater'));
      return;
    }

    const authHeader = opts.event.headers['Authorization'];
    if (opts.jwt_source === 'viewer') {
      jwt.verify(opts.event.headers['Authorization'], config.Session.HMACSecretViewer, (err, claims) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(claims);
      });
    } else if (opts.jwt_source === 'admin') {
      jwt.verify(opts.event.headers['Authorization'], config.Session.HMACSecret, (err, claims) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(claims);
      });
    } else {
      reject(new Error(`invalid jwt_source: ${opts.jwt_source}`));
      return;
    }
  });
}

module.exports = validateSession;
