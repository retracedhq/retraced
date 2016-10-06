'use strict';

const getApiToken = require('../models/apitoken/get');

/**
 * Asynchronously validates an api token from the event, and returns the result.
 * 
 * @param {Object} [event] The lambda params.
 */
function validateApiToken(event) {
  return new Promise((resolve, reject) => {
    // Authorization: Token token=abcdef
    let token;
    const authHeaderParts = event.headers['Authorization'].split(' ');
    if ((authHeaderParts.length === 2) && (authHeaderParts[0] === 'Token')) {
      const tokenParts = authHeaderParts[1].split('=');
      if ((tokenParts.length === 2) && (tokenParts[0] === 'token')) {
        token = tokenParts[1];
      }
    }

    if (!token) {
      reject(new Error('No token'));
      return;
    }

    getApiToken(token)
    .then(resolve)
    .catch(reject);
  });
}

module.exports = validateApiToken;

