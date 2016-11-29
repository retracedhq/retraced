const uuid = require("uuid");

const getViewerToken = require("../models/viewertoken/get");
const createViewersession = require("../models/viewersession/create");
const disque = require("../persistence/disque")();

const handler = (req) => {
  return new Promise((resolve, reject) => {
    let session;
    let token;
    getViewerToken({
      viewer_token: req.body.token,
    })
      .then((t) => {
        token = t;
        return createViewersession({
          token,
        });
      })
      .then((s) => {
        session = s;
        const job = JSON.stringify({
          taskId: uuid.v4().replace(/-/g, ""),
          projectId: token.project_id,
          environmentId: token.environment_id,
          event: "viewer_session",
          timestamp: new Date().getTime(),
        });

        const opts = {
          retry: 600, // seconds
        };
        return disque.addjob("user_reporting_task", job, opts);
      })
      .then(() => {
        resolve(session);
      })
      .catch(reject);
  });
};

module.exports = handler;
