'use strict';

const processEvent = require('./lib/models/event/process');

module.exports.default = (event, context, cb) => {
  const record = event.Records[0];
  if (record.EventSource !== 'aws:sns') {
    console.log('Unexpected event source: ', record.EventSource);
    cb(new Error('Unexpected event source: ', record.EventSource));
    return;
  }

  const message = JSON.parse(record.Sns.Message);

  processEvent(message)
  .then(() => {
    cb(null);
  })
  .catch((err) => {
    cb(err);
  });
};
