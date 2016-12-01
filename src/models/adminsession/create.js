import "datejs";
import * as jwt from "jsonwebtoken";

import getConfig from "../../config/getConfig";

const config = getConfig();

export default function createAdminsession(opts) {
  return new Promise((resolve, reject) => {
    // The token is the claims
    const claims = {
      user_id: opts.user.id,
      expiry: Date.today().add(21).days(),
    };

    resolve(jwt.sign(claims, config.Session.HMACSecret));
  });
}
