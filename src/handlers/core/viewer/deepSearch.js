import * as _ from "lodash";
import * as util from "util";
import * as uuid from "uuid";

import validateSession from "../../../security/validateSession";
import checkAccess from "../../../security/checkAccess";
import deepSearchEvents from "../../../models/event/deepSearch";

import getDisque from "../../../persistence/disque";

const disque = getDisque();

export default function handler(req) {
  return new Promise((resolve, reject) => {
    let searchResults;
    let environmentId;
    validateSession("viewer", req.get("Authorization"))
      .then((claims) => {
        environmentId = claims.environment_id;
        const index = `retraced.${req.params.projectId}.${claims.environment_id}`;
        return deepSearchEvents({
          index,
          group_id: claims.group_id,
          query: req.body.query,
        });
      })
      .then((r) => {
        searchResults = r;

        var defaultQuery = {
          search_text: "",
          length: 25,
          create: true,
          read: false,
          update: true,
          delete: true,
        };

        if (!_.isEqual(defaultQuery, req.body.query)) {
          const job = JSON.stringify({
            taskId: uuid.v4().replace(/-/g, ""),
            projectId: req.params.projectId,
            environmentId: environmentId,
            event: "viewer_search",
            timestamp: new Date().getTime(),
          });
          const opts = {
            retry: 600, // seconds,
            async: true,
          };
          return disque.addjob("user_reporting_task", job, 0, opts);
        }

        return true;
      })
      .then(() => {
        resolve({
          status: 200,
          body: JSON.stringify(searchResults),
        });
      })
      .catch(reject);
  });
};
