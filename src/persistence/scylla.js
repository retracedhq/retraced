import * as cassandra from "cassandra-driver";
import * as dns from "dns";
import * as _ from "lodash";

let scylla;

export default async function getScylla() {
  if (!scylla) {
    const user = process.env.SCYLLA_USER;
    const pw = process.env.SCYLLA_PASSWORD;

    // Manually resolve hostnames of contact points, because cassandra-driver is
    // bizarre and can't handle hostnames being paired with port numbers.
    const contactPoints = [];
    for (const hostAddress of _.split(process.env.SCYLLA_HOSTS, ",")) {
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
      keyspace: process.env.SCYLLA_KEYSPACE,
      authProvider,
    });
  }

  return scylla;
}
