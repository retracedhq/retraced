import validateSession from "../security/validateSession";
import checkAccess from "../security/checkAccess";
import createProject from "../models/project/create";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    validateSession("admin", req.get("Authorization"))
      .then((claims) => {
        return createProject({
          user_id: claims.user_id,
          name: req.body.name,
        });
      })
      .then((project) => {
        resolve({ project });
      })
      .catch(reject);
  });
};
