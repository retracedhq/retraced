import * as _ from "lodash";

// TODO this should return some details about what is missing

/**
 * Asynchronously checks that one or more event objects are valid
 *
 * @param {Object} [opts] The request options.
 * @parma {Object} [opts.event] The event or array of events to validate.
 */
export default function validateEvent(opts) {
  return new Promise((resolve, reject) => {
    let events = opts.event;
    if (!Array.isArray(events)) {
      events = [events];
    }

    _.forEach(events, (e) => {
      const requiredEventFields = [
        "action",
      ];
      const simpleEvent = _.pick(e, requiredEventFields);
      if (!_.isEqual(simpleEvent, removeEmptyFields(simpleEvent))) {
        reject(new Error("invalid event"));
        return false; // break
      }

      // If created is present, it must be parseable
      if (e.created) {
        let createdDate = new Date(e.created).getTime();
        if (_.isNaN(createdDate)) {
          reject(new Error("Invalid created date"));
          return false;
        }
      }

      // An actor needs a name and id, but only if an actor is present.
      // Actors are optional also.
      if (!e.is_anonymous) {
        const requiredActorFields = [
          "name", "id",
        ];
        const simpleActor = _.pick(e.actor, requiredActorFields);
        if (!_.isEqual(simpleActor, removeEmptyFields(simpleActor))) {
          reject(new Error("invalid actor"));
          return false; // break
        }
      }
    });

    resolve(true);
  });
}

function removeEmptyFields(o) {
  // Remove empty and undefined objects
  o = _.omitBy(o, _.isNil);
  o = _.omitBy(o, (val, key) => {
    return _.isEqual(val, "");
  });

  return o;
}
