import getScylla from "../../persistence/scylla";
import getConfig from "../../config/getConfig";

const config = getConfig();

export default function getEvent(opts) {
  return new Promise(async (resolve, reject) => {
    // TODO holy crap, we need to make sure the project and environment match or
    // this is a huge security problem

    const scylladb = await getScylla();

    const selectStmt = `select
      id, actor_id, object_id, description, action, crud, is_failure, is_anonymous, created, received, team_id, source_ip, country, loc_subdiv1, loc_subdiv2, raw
      from retraced.event
      where id = ?;
    `;

    scylladb.execute(selectStmt, [opts.event_id], (err, result) => {
      if (err) {
        console.log(err.stack);
        reject(err);
        return;
      }
      if (result.rows && result.rows.length > 0) {
        resolve(result.rows[0]);
      } else {
        resolve(null);
      }
    });
  });
}
