import "source-map-support/register";
import * as uuid from "uuid";
import Analytics from "analytics-node";

import getPgPool from "../../persistence/pg";
import createApiToken from "../apitoken/create";
import createEnvironment from "../environment/create";
import addUserToProject from "./addUser";

const pgPool = getPgPool();

/**
 * Asynchronously create a new project with the given options
 *
 * @param {Object} [opts] The request options.
 */
export default function createProject(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const project = {
        id: uuid.v4().replace(/-/g, ""),
        name: opts.name,
        created: new Date().getTime(),
        environments: getDefaultEnvironments(),
        api_tokens: [],
      };

      const q = `insert into project (
        id, created, name
      ) values (
        $1, to_timestamp($2), $3
      )`;
      const v = [
        project.id,
        project.created / 1000,
        project.name,
      ];
      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
          return;
        }

        // Report this project as a user to segment
        if (process.env.SEGMENT_WRITE_KEY) {
          const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);
          analytics.identify({
            userId: project.id,
            traits: {
              name: project.name,
              createdAt: project.create,
            },
          });
        }

        const createEnvPromises = [];
        project.environments.forEach((environment) => {
          createEnvPromises.push(createEnvironment({
            id: environment.id,
            name: environment.name,
            project_id: project.id,
          }));
        });

        Promise.all(createEnvPromises)
        .then(() => {
          const createTokenPromises = [];
          project.environments.forEach((environment) => {
            const newApiToken = {
              name: `Default ${environment.name} Token`,
              environment_id: environment.id,
              project_id: project.id,
            };
            createTokenPromises.push(createApiToken(newApiToken));
            project.api_tokens.push(newApiToken);
          });
          return Promise.all(createTokenPromises);
        })
        .then(() => {
          return addUserToProject({
            projectId: project.id,
            userId: opts.user_id,
          });
        })
        .then(() => {
          resolve(project);
        })
        .catch(reject);
      });
    });
  });
}

function getDefaultEnvironments() {
  return [
    {
      id: uuid.v4().replace(/-/g, ""),
      name: "Production",
    },
    {
      id: uuid.v4().replace(/-/g, ""),
      name: "Staging",
    },
  ];
}
