'use strict';

const _ = require('lodash');
const uuid = require('uuid');
require('datejs');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('../../config/getConfig')();
const docClient = require('../../persistence/dynamo')();
const geoip = require('../../persistence/geoip');

/**
 * Asynchronously create a new event with the given options
 *
 * @param {Object} [opts] The request options.
 * @param {Object} [opts.raw] The raw message request received
 */
function createEvent(opts) {
  return new Promise((resolve, reject) => {
    AWS.config.update({
      region: config.DynamoDB.Region,
      endpoint: config.DynamoDB.Endpoint,
      credentials: new AWS.Credentials(config.DynamoDB.AccessKey, config.DynamoDB.SecretKey),
    });

    let table;
    if (config.DynamoDB.TablePrefix) {
      table = `${config.DynamoDB.TablePrefix}-`;
    }
    table = `${table}event`;
    if (config.DynamoDB.TableSuffix) {
      table = `${table}-${config.DynamoDB.TableSuffix}`;
    }

    let events = opts.event;
    if (!Array.isArray(events)) {
      events = [events];
    }

    let actors = opts.actor;
    if (!Array.isArray(actors)) {
      actors = [actors];
    }

    let objects = opts.object;
    if (!objects) {
      objects = [];
    }
    if (!Array.isArray(objects)) {
      objects = [objects];
    }

    Promise.all(_.map(events, (event) => {
      return geoip.getLocationByIP(event.source_ip);
    }))
    .then((locInfos) => {
      const allIds = [];
      const dynamoEvents = _.map(events, (event, i) => {
        const actor = actors[i];
        const object = objects[i];
        const result = {
          id: uuid.v4().replace(/-/g, ''),
          project_id: opts.token.project_id,
          environment_id: opts.token.environment_id,
          received: new Date().getTime(),
          created: event.created,
          title: event.title,
          action: event.action,
          description: event.description,
          source_ip: event.source_ip,
          team_id: event.team_id,
          actor_id: actor.id,
          raw: opts.raw,
        };
        if (object) {
          result.object_id = object.id;
        }

        if (locInfos[i]) {
          const locInfo = locInfos[i];
          if (locInfo.lat) result.lat = locInfo.lat;
          if (locInfo.lon) result.lon = locInfo.lon;
          if (locInfo.country) result.country = locInfo.country;
          if (locInfo.subdiv1) result.locSubdiv1 = locInfo.subdiv1;
          if (locInfo.subdiv2) result.locSubdiv2 = locInfo.subdiv2;
          if (locInfo.timeZone) result.timeZone = locInfo.timeZone;
        }
        allIds.push(result.id); // _.map() is strongly ordered, right...?
        return cleanObjectForDynamo(result);
      });

      const requestItems = {};
      requestItems[table] = _.map(dynamoEvents, (e) => {
        return ({
          PutRequest: {
            Item: e,
          },
        });
      });
      const params = {
        RequestItems: requestItems,
      };

      const cb = (err, resp) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        if (resp.UnprocessedItems && resp.UnprocessedItems.length > 0) {
          docClient.batchWrite({ RequestItems: resp.UnprocessedItems }, cb);
          return;
        }
        resolve(allIds);
      };

      docClient.batchWrite(params, cb);
    })
    .catch((err) => {
      console.log(err);
      reject(err);
    });
  });
}

function cleanObjectForDynamo(o) {
  // support nested objects
  const nestedObjects = _.pickBy(o, _.isPlainObject);
  _.keys(nestedObjects).forEach((key) => {
    o[key] = cleanObjectForDynamo(nestedObjects[key]);
  });

  // Remove empty and undefined objects
  o = _.omitBy(o, _.isNil);
  o = _.omitBy(o, (val, key) => {
    return _.isEqual(val, '');
  });

  // Convert bools to int
  for (const key in _.keys(o)) {
    if (typeof (o[key]) === 'boolean') {
      o[key] = o[key] ? 1 : 0;
    }
  }

  return o;
}

module.exports = createEvent;
