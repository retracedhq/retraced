const getViewerToken = require("../models/viewertoken/get");
const createViewersession = require("../models/viewersession/create");

const handler = (req) => {
  return new Promise((resolve, reject) => {
    getViewerToken({
      viewer_token: req.body.token,
    })
      .then((token) => {
        return createViewersession({
          token,
        });
      })
      .then((session) => {
        resolve(session);
      })
      .catch(reject);
  });
};

module.exports = handler;
