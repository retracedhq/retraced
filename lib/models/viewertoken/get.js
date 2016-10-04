'use strict';

const redis = require('redis');

const config = require('../../config/getConfig')();

/**
 * {
 *   token: {String}
 * }
 */
function getViewertoken(opts) {
  return new Promise((resolve, reject) => {
    const redisClient = redis.createClient({ url: config.Redis.URI });

    redisClient.hgetall(`viewertoken:${opts.token}`, (err, token) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      redisClient.quit();
      resolve(token);
    });
  });
}

module.exports = getViewertoken;
