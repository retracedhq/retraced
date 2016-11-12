const cassandra = require('cassandra-driver');
const config = require('../config/getConfig')();
let scylla;
function getScylla() {
    if (!scylla) {
        const user = config.ScyllaDB.User;
        const pw = config.ScyllaDB.Password;
        const authProvider = new cassandra.auth.PlainTextAuthProvider(user, pw);
        scylla = new cassandra.Client({
            contactPoints: config.ScyllaDB.Hosts,
            keyspace: config.ScyllaDB.Keyspace,
            authProvider,
            protocolOptions: {
                port: config.ScyllaDB.Port,
            },
        });
    }
    return scylla;
}
module.exports = getScylla;
//# sourceMappingURL=scylla.js.map