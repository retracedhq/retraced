const validateSession = require("../security/validateSession");
const checkAccess = require("../security/checkAccess");
const createProject = require("../models/project/create");

const handler = (req) => {
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

module.exports = handler;
