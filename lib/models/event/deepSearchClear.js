'use strict';

const _ = require('lodash');

const es = require('../../persistence/elasticsearch')();

function deepSearchClear(opts) {
  return new Promise((resolve, reject) => {
    es.clearScroll({ scrollId: opts.searchId }, (err, resp, status) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

module.exports = deepSearchClear;
