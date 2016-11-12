let _ = require('lodash');
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
                return false;
            }
            if (e.created) {
                let createdDate = new Date(e.created).getTime();
                if (_.isNaN(createdDate)) {
                    reject(new Error('Invalid created date'));
                    return false;
                }
            }
            if (!e.is_anonymous) {
                const requiredActorFields = [
                    'name', 'id',
                ];
                const simpleActor = _.pick(e.actor, requiredActorFields);
                if (!_.isEqual(simpleActor, removeEmptyFields(simpleActor))) {
                    reject(new Error('invalid actor'));
                    return false;
                }
            }
        });
        resolve(true);
    });
}
function removeEmptyFields(o) {
    o = _.omitBy(o, _.isNil);
    o = _.omitBy(o, (val, key) => {
        return _.isEqual(val, '');
    });
    return o;
}
module.exports = validateEvent;
//# sourceMappingURL=validate.js.map