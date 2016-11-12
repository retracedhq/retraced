const pg = require('pg');
const config = require('../config/getConfig')();
let pgPool;
function getPgPool() {
    if (!pgPool) {
        pgPool = new pg.Pool({
            user: config.Postgres.User,
            database: config.Postgres.Database,
            password: config.Postgres.Password,
            host: config.Postgres.Endpoint,
            port: config.Postgres.Port,
            max: 100,
            idleTimeoutMillis: 30000,
        });
    }
    return pgPool;
}
module.exports = getPgPool;
//# sourceMappingURL=pg.js.map