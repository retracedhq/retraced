'use strict';

const _ = require('lodash');
const uuid = require('uuid');
const util = require('util');

const upsertActor = require('../actor/upsert');
const upsertObject = require('../object/upsert');
const createEvents = require('../event/create');
const saveToSearchbase = require('./saveToSearchbase');
const upsertAction = require('../action/upsert');
const geoip = require('../../persistence/geoip');

function processEvent(message) {
  return new Promise((resolve, reject) => {
    let originalEvents = message.request;

    if (!Array.isArray(originalEvents)) {
      originalEvents = [originalEvents];
    }

    const actorUpserts = Promise.all(_.map(originalEvents, (origEvent) => {
      return upsertActor({
        actor: origEvent.actor,
        token: message.api_token,
      });
    }));

    const objectUpserts = Promise.all(_.map(originalEvents, (origEvent) => {
      if (!origEvent.object) {
        return Promise.resolve(null);
      }
      return upsertObject({
        object: origEvent.object,
        token: message.api_token,
      });
    }));

    const actionUpserts = Promise.all(_.map(originalEvents, (origEvent) => {
      return upsertAction({
        action: origEvent.action,
        token: message.api_token,
      });
    }));

    const geoipResolves = Promise.all(_.map(originalEvents, (origEvent) => {
      return geoip.getLocationByIP(origEvent.source_ip);
    }));

    Promise.all([actorUpserts, objectUpserts, actionUpserts, geoipResolves])
    .then((results) => {
      const actors = results[0];
      const objects = results[1];
      const actions = results[2];
      const locInfos = results[3];

      const normalizedEvents = _.map(originalEvents, (origEvent, i) => {
        const result = _.pick(origEvent, [
          'created', 'action', 'description', 'source_ip', 'team_id',
        ]);
        if (result.source_ip === '') {
          _.unset(result, 'source_ip');
        }

        result.id = uuid.v4().replace(/-/g, '');
        result.received = new Date().getTime();
        result.raw = JSON.stringify(origEvent);
        result.actor = _.mapValues(actors[i], (val, key) => {
          if (key === 'created' || key === 'first_active' || key === 'last_active') {
            return new Date(val).getTime();
          }
          return val;
        });

        if (objects[i]) {
          result.object = objects[i];
        }

        if (locInfos[i]) {
          const locInfo = locInfos[i];
          if (locInfo.lat) result.lat = locInfo.lat;
          if (locInfo.lon) result.lon = locInfo.lon;
          if (locInfo.country) result.country = locInfo.country;
          if (locInfo.subdiv1) result.loc_subdiv1 = locInfo.subdiv1;
          if (locInfo.subdiv2) result.loc_subdiv2 = locInfo.subdiv2;
          if (locInfo.timeZone) result.time_zone = locInfo.timeZone;
        }

        return result;
      });

      const ce = createEvents({
        events: normalizedEvents,
        token: message.api_token,
      });
      const sts = saveToSearchbase({
        events: normalizedEvents,
        token: message.api_token,
      });
      return Promise.all([ce, sts]);
    })
    .then(resolve)
    .catch((err) => {
      console.log(err.stack);
      reject(err);
    });
  });
}

module.exports = processEvent;
