import * as uuid from "uuid";

import getConfig from "../../config/getConfig";
import getPgPool from "../../persistence/pg";
import getEs from "../../persistence/elasticsearch";

const config = getConfig();
const pgPool = getPgPool();
const es = getEs();

/**
 * Asynchronously create a new environment with the given options
 *
 * @param {Object} [opts] The request options.
 */
export default function createEnvironment(opts) {
  return new Promise(async (resolve, reject) => {
    const environment = {
      // TODO(zhaytee): Probably should generate the id here instead of getting it passed in...
      id: opts.id,
      name: opts.name,
      project_id: opts.project_id,
    };

    // Create the ES index
    const alias = `retraced.${environment.project_id}.${environment.id}`;
    const newIndex = `retraced.api.${uuid.v4().replace(/-/g, "")}`;
    const aliases = {};
    aliases[alias] = {};
    const params = {
      index: newIndex,
      body: {
        aliases,
      },
    };

    await es.indices.create(params);

    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }
      const q = `insert into environment (
        id, name, project_id
      ) values (
        $1, $2, $3
      )`;
      const v = [
        environment.id,
        environment.name,
        environment.project_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else {
          resolve(environment);
        }
      });
    });
  });
}
