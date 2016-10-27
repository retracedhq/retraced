'use strict';

const _ = require('lodash');
const uuid = require('uuid');

const upsertActor = require('../actor/upsert');
const upsertObject = require('../object/upsert');
const createEvent = require('../event/create');
const saveToSearchbase = require('./saveToSearchbase');
const upsertAction = require('../action/upsert');

function processEvent(message) {
  return new Promise((resolve, reject) => {
    let events = message.request;
    let actors;
    let objects;
    if (!Array.isArray(events)) {
      events = [events];
    }

    // Some fields on events are generated here on the API side.
    // All databases need to be able to see them.
    _.forEach(events, (e) => {
      e.id = uuid.v4().replace(/-/g, '');
      e.received = new Date().getTime();
      if (e.created) {
        e.created = new Date(e.created).getTime();
      }
    });

    // The only reason this crazy chain works is because Promise.all()'s final result array is
    // guaranteed to be in the same order as the array of promises it was originally given.

    Promise.all(_.map(events, (e) => {
      return upsertActor({
        token: message.api_token,
        actor: e.actor,
      });
    }))
    .then((a) => {
      actors = a;
      const counts = {};
      _.forEach(events, (e, i) => {
        const a = actors[i];
        let c = counts[a.id];
        if (!c) {
          c = { actor: a, count: 1 };
        } else {
          c.count += 1;
        }
        counts[a.id] = c;
      });

      return Promise.all(events.map((e) => {
        if (!e.object) {
          return Promise.resolve({});
        }
        return upsertObject({
          token: message.api_token,
          object: e.object,
        });
      }));
    })
    .then((o) => {
      objects = o;
      const counts = {};
      _.forEach(events, (e, i) => {
        const o = objects[i];
        let c = counts[o.id];
        if (!c) {
          c = { object: o, count: 1 };
        } else {
          c.count += 1;
        }
        counts[o.id] = c;
      });
      return upsertAction({
        action: message.request.action,
        token: message.api_token,
      });
    })
    .then(() => {
      const ce = createEvent({
        token: message.api_token,
        event: events,
        actor: actors,
        object: objects,
      });
      const sts = saveToSearchbase({
        events,
        actors,
        objects,
        token: message.api_token,
      });
      return Promise.all([ce, sts]);
    })
    .then(resolve)
    .catch(reject);
  });
}

module.exports = processEvent;
