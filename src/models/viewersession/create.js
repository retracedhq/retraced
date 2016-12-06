import * as jwt from "jsonwebtoken";

export default function createViewersession(opts) {
  return new Promise((resolve, reject) => {
    // The token is the claims
    const session = {
      project_id: opts.token.project_id,
      project_name: "?",
      token: jwt.sign(opts.token, process.env.HMAC_SECRET_VIEWER),
    };
    resolve(session);
  });
}
