'use strict';

const _ = require('lodash');
const util = require('util');

const es = require('../../persistence/elasticsearch')();

function saveToSearchbase(opts) {
  return new Promise((resolve, reject) => {
    const index = `retraced.${opts.token.project_id}.${opts.token.environment_id}`;
    const body = [];

    let events = opts.events;
    if (!Array.isArray(events)) {
      events = [events];
    }

    _.forEach(events, (e, i) => {
      body.push({
        index: {
          _index: index,
          _type: 'event',
        },
      });

      // Pare down the actor object a bit.
      e.actor = _.pick(e.actor, ['id', 'name', 'created', 'first_active', 'last_active']);

      body.push(e);
    });

    es.bulk({ body }, (err, resp, status) => {
      if (resp.errors) {
        console.log(JSON.stringify(resp));
      }
      if (err) {
        console.log(err.stack);
        reject(err);
        return;
      }
      resolve();
    });
  });
}

module.exports = saveToSearchbase;
