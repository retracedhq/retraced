'use strict';

const processEvent = require('./lib/models/event/process');

const handler = (event, context, cb) => {
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

if (require('./lib/config/getConfig')().IOPipe.ClientID) {
  const iopipe = require('iopipe')({
    clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
  });

  module.exports.default = iopipe(handler);
} else {
  module.exports.default = handler;
}
