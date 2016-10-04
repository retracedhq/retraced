'use strict';

const _ = require('lodash');

const upsertActor = require('../actor/upsert');
const upsertObject = require('../object/upsert');
const createEvent = require('../event/create');
const saveToSearchbase = require('./saveToSearchbase');
const upsertAction = require('../action/upsert');

function processEvent(message) {
  return new Promise((resolve, reject) => {
    let events = message.request;
    let actors, objects;
    if (!Array.isArray(events)) {
      events = [events];
    }

    // The only reason this crazy chain works is because Promise.all()'s final result array is
    // guaranteed to be in the same order as the array of promises it was originally given.

    Promise.all(events.map((e) => {
      return upsertActor({
        token: message.token,
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
          return new Promise((resolve, reject) => {
            resolve({})
          })
        };
        return upsertObject({
          token: message.token,
          object: e.object
        });        
      }))
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
        token: message.token
      })
    })
    .then(() => {
      return createEvent({
        token: message.token,
        event: events,
        actor: actors,
        object: objects,
        raw: message.request
      });
    })
    .then(() => {
      return saveToSearchbase({
        events,
        actors,
        objects,
        token: message.token,
      });
    })
    .then(resolve)
    .catch(reject);
  });
}

module.exports = processEvent;
