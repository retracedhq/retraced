import _ from "lodash";
import moment from "moment";

export const mapValues = (obj) => {
  return _.mapValues(obj, (val, key) => {
    if (
      key === "created" ||
      key === "created_at" ||
      key === "first_active" ||
      key === "last_active" ||
      key === "received" ||
      key === "canonical_time"
    ) {
      return moment(Math.trunc(val)).valueOf();
    }
    if (key === "event_count") {
      return Number(val);
    }
    return val;
  });
};
