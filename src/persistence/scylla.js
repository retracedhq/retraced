import "source-map-support/register";
import * as cassandra from "cassandra-driver";
import * as dns from "dns";

import getConfig from "../config/getConfig";

const config = getConfig();
let scylla;

export default async function getScylla() {
  if (!scylla) {
    const user = config.ScyllaDB.User;
    const pw = config.ScyllaDB.Password;

    // Manually resolve hostnames of contact points, because cassandra-driver is
    // bizarre and can't handle hostnames being paired with port numbers.
    const contactPoints = [];
    for (const hostAddress of config.ScyllaDB.Hosts) {
      const toks = hostAddress.split(":");
      const hostname = toks[0];
      const port = toks[1];
      const ipAddress = await new Promise((resolve, reject) => {
        dns.lookup(hostname, 4, (err, addr, fam) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(addr);
        });
      });
      console.log(`ScyllaDB contact point '${hostAddress}' resolved to: '${ipAddress}:${port}'`);
      contactPoints.push(`${ipAddress}:${port}`);
    }

    const authProvider = new cassandra.auth.PlainTextAuthProvider(user, pw);
    scylla = new cassandra.Client({
      contactPoints,
      keyspace: config.ScyllaDB.Keyspace,
      authProvider,
    });
  }

  return scylla;
}
