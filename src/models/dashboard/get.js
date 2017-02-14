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
export default function getDashboard(opts) {
  return new Promise((resolve, reject) => {
    let result = {};

    getReportingEvents(opts)
      .then((r) => {
        result = _.merge(result, r);
        return getActiveUsers(opts);
      })
      .then((r) => {
        result.active_users = r;
        return getActiveGroups(opts);
      })
      .then((r) => {
        result.active_groups = r;
        resolve(result);
      });
  });
}

async function getActiveUsers(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `
 with one_hour_intervals as (
  select 
    (select min(created_at)::date from active_actor) + (n || ' minutes')::interval start_time,
    (select min(created_at)::date from active_actor) + ((n+60) || ' minutes')::interval end_time
  from generate_series(0, (24*60), 60) n
)
select h.start_time, h.end_time, count(1)  
from active_actor m
right join one_hour_intervals h 
        on m.created_at >= h.start_time and m.created_at < h.end_time
where m.project_id = $1
and m.environment_id = $2
group by h.start_time, h.end_time
order by h.start_time`;

      const v = [opts.project_id, opts.environment_id];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows);
        } else {
          resolve([]);
        }
      });
    });
  });
}

async function getActiveGroups(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `
 with one_hour_intervals as (
  select 
    (select min(created_at)::date from active_group) + (n || ' minutes')::interval start_time,
    (select min(created_at)::date from active_group) + ((n+60) || ' minutes')::interval end_time
  from generate_series(0, (24*60), 60) n
)
select h.start_time, h.end_time, count(1)  
from active_group m
right join one_hour_intervals h 
        on m.created_at >= h.start_time and m.created_at < h.end_time
where m.project_id = $1
and m.environment_id = $2
group by h.start_time, h.end_time
order by h.start_time`;

      const v = [opts.project_id, opts.environment_id];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows);
        } else {
          resolve([]);
        }
      });
    });
  });
}

async function getReportingEvents(opts) {
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
and m.project_id = $2
and m.environment_id = $3
group by h.start_time, h.end_time
order by h.start_time`;

          const v = [e, opts.project_id, opts.environment_id];

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
