

const uuid = require('uuid');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('../config/getConfig')();
const validateEvent = require('../models/event/validate');
const checkAccess = require('../security/checkAccess');
const validateApiToken = require('../security/validateApiToken');
const processEvent = require('../models/event/process');

const handler = (req) => {
  return Promise.resolve();
};

module.exports = handler;
