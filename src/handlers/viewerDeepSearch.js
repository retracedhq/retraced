const _ = require("lodash");
const util = require("util");

const validateSession = require("../security/validateSession");
const checkAccess = require("../security/checkAccess");
const deepSearchEvents = require("../models/event/deepSearch");

const handler = (req) => {
  return new Promise((resolve, reject) => {
    validateSession("viewer", req.get("Authorization"))
      .then((claims) => {
        const index = `retraced.${req.params.projectId}.${claims.environment_id}`;
        return deepSearchEvents({
          index,
          team_id: claims.team_id,
          query: req.body.query,
        });
      })
      .then((searchResults) => {
        resolve(searchResults);
      })
      .catch(reject);
  });
};

module.exports = handler;
