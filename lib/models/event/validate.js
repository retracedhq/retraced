'use strict';

let _ = require('lodash');

// TODO this should return some details about what is missing

/**
 * Asynchronously checks that one or more event objects are valid
 *
 * @param {Object} [opts] The request options.
 */
function validateEvent(opts) {
  return new Promise((resolve, reject) => {
    let events = opts.event;
    if (!Array.isArray(events)) {
      events = [events];
    }

    _.forEach(events, (e) => {
      const requiredEventFields = [
        'action',
      ];
      const simpleEvent = _.pick(e, requiredEventFields);
      if (!_.isEqual(simpleEvent, removeEmptyFields(simpleEvent))) {
        reject(new Error('invalid event'));
        return false; // break
      }

      const requiredActorFields = [
        'name', 'id',
      ];
      const simpleActor = _.pick(e.actor, requiredActorFields);
      if (!_.isEqual(simpleActor, removeEmptyFields(simpleActor))) {
        reject(new Error('invalid actor'));
        return false; // break
      }
    });

    resolve(true);
  });
}

function removeEmptyFields(o) {
  // Remove empty and undefined objects
  o = _.omitBy(o, _.isNil);
  o = _.omitBy(o, (val, key) => {
    return _.isEqual(val, '');
  });

  return o;
}

module.exports = validateEvent;
