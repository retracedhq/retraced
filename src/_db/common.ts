import "source-map-support/register";
import getPgPool from "./persistence/pg";
import * as bugsnag from "bugsnag";

const pgPool = getPgPool();

const useCache = !process.env.RETRACED_DB_NO_CACHE;
const actorCache = {};
const targetCache = {};
const groupCache = {};

const common = {
  getActor: (id) => {
    return new Promise((resolve, reject) => {
      const maybeActor = actorCache[id];
      if (maybeActor) {
        resolve(maybeActor);
        return;
      }

      pgPool.connect((err, pg, done) => {
        if (err) {
          reject(err);
          return;
        }

        const q = "select * from actor where id = $1";
        const v = [id];
        pg.query(q, v, (qerr, result) => {
          done();
          if (qerr) {
            reject(qerr);
          } else if (result.rowCount > 0) {
            const actor = result.rows[0];
            if (useCache) {
              actorCache[id] = actor;
            }
            resolve(actor);
          } else {
            resolve(undefined);
          }
        });
      });
    });
  },

  getTarget: (id) => {
    return new Promise((resolve, reject) => {
      const maybeTarget = targetCache[id];
      if (maybeTarget) {
        resolve(maybeTarget);
        return;
      }

      pgPool.connect((err, pg, done) => {
        if (err) {
          reject(err);
          return;
        }

        const q = "select * from target where id = $1";
        const v = [id];
        pg.query(q, v, (qerr, result) => {
          done();
          if (qerr) {
            reject(qerr);
          } else if (result.rowCount > 0) {
            const object = result.rows[0];
            if (useCache) {
              targetCache[id] = object;
            }
            resolve(object);
          } else {
            resolve(undefined);
          }
        });
      });
    });
  },

  getGroup: (id) => {
    return new Promise((resolve, reject) => {
      const maybeGroup = groupCache[id];
      if (maybeGroup) {
        resolve(maybeGroup);
        return;
      }

      pgPool.connect((err, pg, done) => {
        if (err) {
          reject(err);
          return;
        }

        const q = "select * from group_detail where group_id = $1";
        const v = [id];
        pg.query(q, v, (qerr, result) => {
          done();
          if (qerr) {
            reject(qerr);
          } else if (result.rowCount > 0) {
            const group = result.rows[0];
            if (useCache) {
              groupCache[id] = group;
            }
            resolve(group);
          } else {
            resolve(undefined);
          }
        });
      });
    });
  },
};

function setupBugsnag() {
  if (!process.env["BUGSNAG_TOKEN"]) {
    // console.error("BUGSNAG_TOKEN not set, error reports will not be sent to bugsnag");
  } else {
    bugsnag.register(process.env["BUGSNAG_TOKEN"] || "", {
      releaseStage: process.env["STAGE"],
      notifyReleaseStages: ["production", "staging"],
    });
  }
}

export default common;
export { setupBugsnag };
