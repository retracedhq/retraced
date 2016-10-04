'use strict';

var fs = require('fs');

/**
 * Synchronously returns the config for the current environment.
 */
function getConfig() {
  return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
}

module.exports = getConfig;