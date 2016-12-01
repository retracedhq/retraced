import validateSession from "../security/validateSession";
import listProjects from "../models/project/list";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    validateSession("admin", req.get("Authorization"))
      .then((claims) => {
        return listProjects({
          user_id: claims.user_id,
        });
      })
      .then((projects) => {
        resolve({ projects });
      })
      .catch(reject);
  });
};
