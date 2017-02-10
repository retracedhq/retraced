import "source-map-support/register";
import * as _ from "lodash";
import * as uuid from "uuid";
import * as util from "util";

import getScylla from "../../persistence/scylla";

export default function getEventsBulk(opts) {
  return new Promise(async (resolve, reject) => {
    const scylladb = await getScylla();

    const selectStmt = `select
      id, actor_id, object_id, description, action, crud, is_failure, is_anonymous, created, received, team_id, source_ip, country, loc_subdiv1, loc_subdiv2, raw
      from retraced.event
      where id in ?;
    `;

    scylladb.execute(selectStmt, [opts.event_ids], (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      if (result.rows && result.rows.length > 0) {
        resolve(result.rows);
      } else {
        resolve([]);
      }
    });
  });
}
