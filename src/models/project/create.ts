import Analytics from "analytics-node";
import moment from "moment";

import getPgPool from "../../persistence/pg";
import createApiToken from "../api_token/create";
import createEnvironment from "../environment/create";
import addUserToProject from "./addUser";
import { Environment } from "../environment";
import { ApiToken } from "../api_token";
import config from "../../config";

const pgPool = getPgPool();

/**
 * Asynchronously create a new project with the given options
 */
export default function createProject(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      if (!pg) {
        reject(new Error("Couldn't connect to postgres"));
        return;
      }

      const project = {
        id: opts.id || crypto.randomUUID().replace(/-/g, ""),
        name: opts.name,
        created: moment().unix(),
        environments: opts.env ? opts.env : getDefaultEnvironments(),
        tokens: [] as ApiToken[],
      };

      const q = `insert into project (
        id, created, name
      ) values (
        $1, to_timestamp($2), $3
      )`;
      const v = [project.id, project.created, project.name];
      pg.query(q, v, (qerr) => {
        done();
        if (qerr) {
          reject(qerr);
          return;
        }

        // Report this project as a user to segment
        if (config.SEGMENT_WRITE_KEY) {
          const analytics = new Analytics(config.SEGMENT_WRITE_KEY);
          analytics.identify({
            userId: project.id,
            traits: {
              name: project.name,
              createdAt: project.created,
            },
          });
        }

        const createEnvPromises = [] as Promise<Environment>[];
        project.environments.forEach((environment) => {
          createEnvPromises.push(
            createEnvironment({
              name: environment.name,
              projectId: project.id,
            })
          );
        });

        Promise.all(createEnvPromises)
          .then((envs) => {
            const createTokenPromises = [] as Promise<ApiToken>[];
            project.environments = envs;
            project.environments.forEach((environment: Environment) => {
              const newApiToken = {
                name: `Default ${environment.name} Token`,
                disabled: false,
              };
              createTokenPromises.push(createApiToken(project.id, environment.id, newApiToken));
            });
            return Promise.all(createTokenPromises);
          })
          .then((newApiTokens) => {
            for (const t of newApiTokens) {
              project.tokens.push(t);
            }
            if (opts.user_id) {
              return addUserToProject({
                projectId: project.id,
                userId: opts.user_id,
              });
            }
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
      name: "Production",
    },
    {
      name: "Staging",
    },
  ];
}
