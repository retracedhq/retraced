'use strict';

const redis = require('redis');

const config = require('../../config/getConfig')();

/**
 * {
 *   viewer_token: {String}
 * }
 */
function getViewerToken(opts) {
  return new Promise((resolve, reject) => {
    const redisClient = redis.createClient({ url: config.Redis.URI });

    redisClient.hgetall(`viewertoken:${opts.viewer_token}`, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      redisClient.quit();
      resolve(result);
    });
  });
}

module.exports = getViewerToken;
