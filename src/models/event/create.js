

const _ = require('lodash');
const uuid = require('uuid');
require('datejs');
const AWS = require('aws-sdk');
const util = require('util');
const Analytics = require('analytics-node');

const config = require('../../config/getConfig')();
const docClient = require('../../persistence/dynamo')();
const scylladb = require('../../persistence/scylla')();

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

    let events = opts.events;
    if (!Array.isArray(events)) {
      events = [events];
    }

    const saveToDynamo = new Promise((resolve_, reject_) => {
      // Flatten actor and object, and normalize.
      const normalizedEvents = _.map(events, (origEvent) => {
        let ev = _.cloneDeep(origEvent);
        ev.actor_id = ev.actor.id;
        _.unset(ev, 'actor');
        if (ev.object) {
          ev.object_id = ev.object.id;
          _.unset(ev, 'object');
        }

        ev = _.omitBy(ev, _.isNil);
        ev = _.omitBy(ev, (val, key) => {
          return _.isEqual(val, '');
        });
        ev = _.mapValues(ev, (val, key) => {
          if (typeof val === 'boolean') {
            return val ? 1 : 0;
          }
          return val;
        });

      if (process.env.SEGMENT_WRITE_KEY) {
        const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);
        analytics.track({
          userId: opts.token.project_id,
          event: 'event.create'
        });
      }

        return ev;
      });

      const requestItems = {};
      requestItems[table] = _.map(normalizedEvents, (ev) => {
        return {
          PutRequest: {
            Item: ev,
          },
        };
      });
      const params = {
        RequestItems: requestItems,
      };

      const cb = (err, resp) => {
        if (err) {
          console.log(err.stack);
          reject_(err);
          return;
        }
        if (resp.UnprocessedItems && resp.UnprocessedItems.length > 0) {
          docClient.batchWrite({ RequestItems: resp.UnprocessedItems }, cb);
          return;
        }
        resolve_();
      };

      docClient.batchWrite(params, cb);
    });

    const saveToScylla = new Promise((resolve_, reject_) => {
      const insertStmt = `insert into retraced.event
        (id, actor_id, object_id, description, action, crud, is_failure, is_anonymous, created, received, team_id, source_ip, country, loc_subdiv1, loc_subdiv2)
        values
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      const normalizedEvents = _.map(events, (origEvent) => {
        const ev = _.cloneDeep(origEvent);
        ev.actor_id = ev.actor.id;
        _.unset(ev, 'actor');
        if (ev.object) {
          ev.object_id = ev.object.id;
          _.unset(ev, 'object');
        }
        return ev;
      });

      const queries = [];
      _.forEach(normalizedEvents, (eventToSave) => {
        queries.push({
          query: insertStmt,
          params: [
            eventToSave.id,
            eventToSave.actor_id,
            eventToSave.object_id,
            eventToSave.description,
            eventToSave.action,
            eventToSave.crud,
            eventToSave.is_failure,
            eventToSave.is_anonymous,
            eventToSave.created,
            eventToSave.received,
            eventToSave.team_id,
            eventToSave.source_ip,
            eventToSave.country,
            eventToSave.loc_subdiv1,
            eventToSave.loc_subdiv2,
          ],
        });
      });

      scylladb.batch(queries, { prepare: true }, (err) => {
        if (err) {
          console.log(err.stack);
          reject_(err);
          return;
        }
        resolve_();
      });
    });

    Promise.all([saveToDynamo, saveToScylla])
    .then(resolve)
    .catch(reject);
  });
}

module.exports = createEvent;
