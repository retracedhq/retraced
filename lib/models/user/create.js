const uuid = require('uuid');
const pgPool = require('../../persistence/pg')();
function createUser(opts) {
    return new Promise((resolve, reject) => {
        const rollback = (client, done) => {
            client.query('ROLLBACK', (err) => {
                done(err);
                reject('DUPLICATE_EMAIL');
            });
        };
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            pgPool.query('BEGIN', (err) => {
                if (err) {
                    return rollback(pgPool, done);
                }
                process.nextTick(() => {
                    const q = 'select count(1) from retraceduser where email = $1';
                    const v = [opts.email];
                    pgPool.query(q, v, (qerr, result) => {
                        if (qerr) {
                            reject(qerr);
                            return;
                        }
                        if (result.rows[0].count > 0) {
                            rollback(pgPool, done);
                            return;
                        }
                        const user = {
                            id: uuid.v4().replace(/-/g, ''),
                            email: opts.email,
                            created: new Date().getTime(),
                            last_login: new Date().getTime(),
                            password_crypt: opts.hashedPassword,
                        };
                        const qq = `insert into retraceduser (
              id, email, created, last_login, password_crypt
            ) values (
              $1, $2, to_timestamp($3), to_timestamp($4), $5
            )`;
                        const vv = [
                            user.id,
                            user.email,
                            user.created / 1000,
                            user.last_login / 1000,
                            user.password_crypt,
                        ];
                        pgPool.query(qq, vv, (qerr, result) => {
                            if (qerr) {
                                reject(qerr);
                            }
                            else {
                                pgPool.query('COMMIT', done);
                                resolve(user);
                            }
                        });
                    });
                });
                return null;
            });
        });
    });
}
module.exports = createUser;
//# sourceMappingURL=create.js.map