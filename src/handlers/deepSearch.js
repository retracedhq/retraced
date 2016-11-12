const _ = require('lodash');
const util = require('util');

const validateSession = require('../security/validateSession');
const checkAccess = require('../security/checkAccess');
const deepSearchEvents = require('../models/event/deepSearch');

const handler = (req) => {
  return new Promise((resolve, reject) => {
  if (!req.query.environment_id) {
    reject({ status: 400, err: new Error('Missing environment_id') });
    return;
  }

  validateSession("admin", req.get("Authorization"))
    .then((claims) => {
      const index = `retraced.${req.params.projectId}.${req.query.environment_id}`;
      const query = req.body.query;
      query.create = true;
      query.read = true;
      query.update = true;
      query.delete = true;

      return deepSearchEvents({
        index,
        team_omitted: true,
        query: query,
      });
    })
    .then((searchResults) => {
      resolve(searchResults);
    })
    .catch(reject);
  });
};

module.exports = handler;
