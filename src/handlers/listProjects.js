const validateSession = require("../security/validateSession");
const listProjects = require("../models/project/list");

const handler = (req) => {
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

module.exports = handler;
