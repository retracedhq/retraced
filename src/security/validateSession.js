const jwt = require("jsonwebtoken");

const config = require("../config/getConfig")();

/**
 * Asynchronously validates a JWT token from the event, and returns the claims.
 *
 * @param {Object} The request options
 */
function validateSession(jwtSource, authString) {
  return new Promise((resolve, reject) => {
    if (!jwtSource) {
      reject(new Error("missing jwt_source parmater"));
      return;
    }

    const authHeader = authString;
    if (jwtSource === "viewer") {
      jwt.verify(authString, config.Session.HMACSecretViewer, (err, claims) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(claims);
      });
    } else if (jwtSource === "admin") {
      jwt.verify(authString, config.Session.HMACSecret, (err, claims) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(claims);
      });
    } else {
      reject(new Error(`invalid jwt_source: ${jwtSource}`));
      return;
    }
  });
}

module.exports = validateSession;
