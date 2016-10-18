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

    let actors = opts.actors;
    if (!Array.isArray(actors)) {
      actors = [actors];
    }

    let objects = opts.objects;
    if (!Array.isArray(objects)) {
      objects = [objects];
    }

    _.forEach(events, (e, i) => {
      body.push({
        index: {
          _index: index,
          _type: 'event',
        },
      });

      let elasticEvent = _.cloneDeep(e);
      for (var k in elasticEvent) {
        if (k == 'created' || k == 'received') {
          elasticEvent[k] = new Date(elasticEvent[k]).getTime();
        }
      };

      body.push(elasticEvent);
    });

    console.log('Saving event to ES: ' + JSON.stringify(body));
    es.bulk({ body }, (err, resp, status) => {
      console.log(status);
      console.log(resp);
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      resolve(resp);
    });
  });
}

module.exports = saveToSearchbase;
