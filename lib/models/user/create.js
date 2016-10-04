'use strict';

const uuid = require('uuid');

const pgPool = require('../../persistence/pg')();

/**
 * createUser will create a new user account
 *
 * @param {Object} [opts] the request options
 * @param {string} [opts.email] the email address to use
 * @param {string} [opts.hashedPassword] the bcrypted password
 */
function createUser(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const user = {
        id: uuid.v4().replace(/-/g, ''),
        email: opts.email,
        created: new Date().getTime(),
        last_login: new Date().getTime(),
        password_crypt: opts.hashedPassword,
      };

      const q = `insert into retraceduser (
        id, email, created, last_login, password_crypt
      ) values (
        $1, $2, to_timestamp($3), to_timestamp($4), $5
      )`;
      const v = [
        user.id,
        user.email,
        user.created,
        user.last_login,
        user.password_crypt,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else {
          resolve(user);
        }
      });
    });
  });
}

module.exports = createUser;
