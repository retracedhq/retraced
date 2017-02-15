import "source-map-support/register";
import * as jwt from "jsonwebtoken";

/**
 * Asynchronously validates a JWT token from the event, and returns the claims.
 *
 * @param {Object} The request options
 */
export default function validateSession(jwtSource, authString) {
  return new Promise((resolve, reject) => {
    if (!jwtSource) {
      reject(new Error("missing jwt_source parmater"));
      return;
    }

    if (jwtSource === "viewer") {
      jwt.verify(authString, process.env.HMAC_SECRET_VIEWER, (err, claims) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(claims);
      });
    } else if (jwtSource === "admin") {
      jwt.verify(authString, process.env.HMAC_SECRET_ADMIN, (err, claims) => {
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
