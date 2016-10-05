'use strict';

const uuid = require('uuid');

const pgPool = require('../../persistence/pg')();
const createApiToken = require('../apitoken/create');
const createEnvironment = require('../environment/create');
const addUserToProject = require('./access').addUserToProject;

/**
 * Asynchronously create a new project with the given options
 *
 * @param {Object} [opts] The request options.
 */
function createProject(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const project = {
        id: uuid.v4().replace(/-/g, ''),
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
        project.created,
        project.name,
      ];
      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
          return;
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
            project.tokens.push(newApiToken);
          });
          return Promise.all(createTokenPromises);
        })
        .then(addUserToProject(project.id, opts.user_id))
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
      id: uuid.v4().replace(/-/g, ''),
      name: 'Production',
    },
    {
      id: uuid.v4().replace(/-/g, ''),
      name: 'Staging',
    },
  ];
}

module.exports = createProject;
