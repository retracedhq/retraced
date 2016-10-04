'use strict';

const es = require('../../persistence/elasticsearch');

function deepSearchEvents(opts) {
  return new Promise((resolve, reject) => {
    const params = {
      index: opts.index,
      body: {
        query: {
          match: opts.query,
        },
      },
    };

    es.search(params, (err, resp, status) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(resp);
    });
  });
}

module.exports = deepSearchEvents;
