'use strict';

const _ = require('lodash');
const util = require('util');
const uuid = require('uuid');

const es = require('../../persistence/elasticsearch')();

function saveToSearchbase(opts) {
  return new Promise((resolve, reject) => {
    const alias = `retraced.${opts.token.project_id}.${opts.token.environment_id}`;

    // If alias doesn't exist, we probably need to create a new index.
    es.indices.existsAlias({ name: alias })
    .then((exists) => {
      if (exists) {
        return Promise.resolve();
      }
      const newIndex = `retraced.api.${uuid.v4()}`;
      const aliases = {};
      aliases[alias] = {};
      const params = {
        index: newIndex,
        body: {
          aliases,
        },
      };
      return es.indices.create(params);
    })
    .then(() => {
      const body = [];
      let events = opts.events;
      if (!Array.isArray(events)) {
        events = [events];
      }
      _.forEach(events, (e, i) => {
        body.push({
          index: {
            _index: alias,
            _type: 'event',
          },
        });

        // Pare down the actor object a bit.
        e.actor = _.pick(e.actor, ['id', 'name', 'created', 'first_active', 'last_active']);
        body.push(e);
      });
      return es.bulk({ body });
    })
    .then((resp) => {
      if (resp.errors === true) {
        let errString = '[400] ';
        _.forEach(resp.items, (itemObj) => {
          _.forEach(itemObj, (item, opName) => {
            const errorDesc = `'${opName}' failed: ${item.error.reason}, ${item.error.caused_by.reason}`;
            errString += `${errorDesc}; `;
          });
        });
        errString = _.trimEnd(errString, '; ');
        reject(new Error(errString));
        return;
      }

      resolve();
    })
    .catch((err) => {
      console.log(err.stack);
      reject(err);
    });
  });
}

module.exports = saveToSearchbase;
