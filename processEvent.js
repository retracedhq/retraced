'use strict';

const processEvent = require('./lib/models/event/process');

const iopipe = require('iopipe')({
  clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
});

module.exports.default = iopipe(
  (event, context, cb) => {
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
  }
);
