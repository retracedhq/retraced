import _ from "lodash";
import moment from "moment";

const dateKeys = ["created", "created_at", "first_active", "last_active", "received", "canonical_time"];
const numberKeys = ["event_count"];

export const mapValues = (obj) => {
  return _.mapValues(obj, (val, key) => {
    switch (true) {
      case dateKeys.includes(key):
        return moment(Math.trunc(val)).valueOf();
      case numberKeys.includes(key):
        return Number(val);
      default:
        return val;
    }
  });
};