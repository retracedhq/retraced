import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import deepSearchEvents from "../../models/event/deepSearch";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.environment_id) {
      reject({ status: 400, err: new Error("Missing environment_id") });
      return;
    }

    validateSession("admin", req.get("Authorization"))
      .then((claims) => {
        const index = `retraced.${req.params.projectId}.${req.query.environment_id}`;
        const query = req.body.query;
        query.create = true;
        query.read = true;
        query.update = true;
        query.delete = true;

        return deepSearchEvents({
          index,
          group_omitted: true,
          query: query,
        });
      })
      .then((searchResults) => {
        resolve({
          status: 200,
          body: JSON.stringify(searchResults),
        });
      })
      .catch(reject);
  });
};
