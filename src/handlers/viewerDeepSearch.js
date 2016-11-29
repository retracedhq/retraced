const _ = require("lodash");
const util = require("util");
const uuid = require("uuid");

const validateSession = require("../security/validateSession");
const checkAccess = require("../security/checkAccess");
const deepSearchEvents = require("../models/event/deepSearch");
const disque = require("../persistence/disque")();

const handler = (req) => {
  return new Promise((resolve, reject) => {
    let searchResults;
    let environmentId;
    validateSession("viewer", req.get("Authorization"))
      .then((claims) => {
        environmentId = claims.environment_id;
        const index = `retraced.${req.params.projectId}.${claims.environment_id}`;
        return deepSearchEvents({
          index,
          team_id: claims.team_id,
          query: req.body.query,
        });
      })
      .then((r) => {
        searchResults = r;

        var defaultQuery = {
          search_text: "",
          length: 25,
          create: true,
          read: false,
          update: true,
          delete: true,
        };

        if (!_.isEqual(defaultQuery, req.body.query)) {
          const job = JSON.stringify({
            taskId: uuid.v4().replace(/-/g, ""),
            projectId: req.params.projectId,
            environmentId: environmentId,
            event: "viewer_search",
            timestamp: new Date().getTime(),
          });
          const opts = {
            retry: 600, // seconds
          };
          return disque.addjob("user_reporting_task", job, opts);
        }

        return true;
      })
      .then(() => {
        resolve(searchResults);
      })
      .catch(reject);
  });
};

module.exports = handler;
