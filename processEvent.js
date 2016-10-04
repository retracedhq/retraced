'use strict';

var processEvent = require('./lib/models/event/process');

module.exports.default = (event, context, cb) => {
  var record = event.Records[0];
  if (record.EventSource !== 'aws:sns') {
    cb(new Error('Unexpected event source: ', record.EventSource));
    return;
  }

  var message = JSON.parse(record.Sns.Message);

  processEvent(message)
    .then(() => {
      cb(null);
    })
    .catch((err) => {
      cb(err);
    })
}

