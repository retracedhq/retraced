import * as jwt from "jsonwebtoken";
import * as moment from "moment";

export default function (opts) {
  // The token is the claims
  const claims = {
    user_id: opts.user.id,
  };

  return jwt.sign(claims, process.env.HMAC_SECRET_ADMIN, {
    expiresIn: "21d",
  });
}
