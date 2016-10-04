'use strict';

const uuid = require('uuid');
const redis = require('redis');

const config = require('../../config/getConfig')();

/**
 * {
 *   project_id: {String}
 *   environment_id: {String}
 *   actor_foreign_id: {String}
 *   team_id: {String}
 *   format: {String}
 * }
 */
function createViewertoken(opts) {
  return new Promise((resolve, reject) => {
    const redisClient = redis.createClient({ url: config.Redis.URI });
    const token = uuid.v4().replace(/-/g, '');

    const hash = {
      project_id: opts.project_id,
      environment_id: opts.environment_id,
      team_id: opts.team_id,
      created: new Date().getTime(),
      expires: new Date(new Date().getTime() + 5*60000).getTime(), // 5 minutes
      format: opts.format,
    };
    redisClient.HMSET(`viewertoken:${token}`, hash, (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      redisClient.expire(`viewertoken:${token}`, 5*60, (err, res) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }

        redisClient.quit();
        resolve({
          'token': token,
        });
        return;
      });
    });
  });
}

module.exports = createViewertoken;
