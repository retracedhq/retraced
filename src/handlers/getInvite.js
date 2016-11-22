const getInvite = require("../models/team/invite/get");

const handler = (req) => {
  return new Promise((resolve, reject) => {
    getInvite(req.query.id)
      .then((invitation) => {
        resolve({ invitation: invitation });
      })
      .catch(reject);
  });
};

module.exports = handler;
