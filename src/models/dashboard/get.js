import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * getDashboard returns a Promise that retrieves all of the dashboard metrics
 * for a given project and environment
 *
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 */
export default function listActions(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const events = [
        "viewer_session",
        "viewer_search",
      ];

      const promises = _.map(events, (e) => {
        return new Promise((rresolve, rreject) => {
          const q = `
with one_hour_intervals as (
  select 
    (select min(created_at)::date from reporting_event) + (n || ' minutes')::interval start_time,
    (select min(created_at)::date from reporting_event) + ((n+60) || ' minutes')::interval end_time
  from generate_series(0, (24*60), 60) n
)
select h.start_time, h.end_time, count(1)  
from reporting_event m
right join one_hour_intervals h 
        on m.created_at >= h.start_time and m.created_at < h.end_time
where m.event_name = $1
group by h.start_time, h.end_time
order by h.start_time`;

          const v = [e];

          pg.query(q, v, (qerr, result) => {
            done();
            if (qerr) {
              rreject(qerr);
            } else if (result.rowCount > 0) {
              rresolve(result.rows);
            } else {
              rresolve([]);
            }
          });
        });
      });

      Promise.all(promises)
        .then((results) => {
          const r = {};
          for (let i = 0; i < events.length; i++) {
            r[events[i]] = results[i];
          }
          resolve(r);
        })
        .catch((perr) => {
          reject(perr);
        });
    });
  });
}
