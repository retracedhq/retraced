import * as hiredis from "hiredis";
import * as _ from "lodash";

let sharedClient;

export default function getDisque() {
  if (!sharedClient) {
    sharedClient = new DisqueClient();
  }

  return sharedClient;
}

export class DisqueClient {
  constructor() {
    this.nodes = [];
    _.split(process.env.DISQUE_NODES, ",").forEach((n) => {
      const parts = n.split(":");
      this.nodes.push({
        host: parts[0],
        port: parts[1],
      });
    });

    this.password = process.env.DISQUE_PASSWORD;
  }

  connect() {
    if (this.hiredisSocket) {
      return;
    }

    console.log(`Opening new Disque connection to ${this.nodes[0].host}:${this.nodes[0].port}...`);

    this.hiredisSocket = hiredis.createConnection(this.nodes[0].port, this.nodes[0].host);
    this.pendingOps = [];
    this.hiredisSocket
      .on("reply", data => {
        if (data instanceof Error) {
          this.pendingOps.shift().reject(data);
        } else {
          this.pendingOps.shift().resolve(data);
        }
      })
      .on("error", err => {
        console.log(`Disque connection failure: ${err.stack}`);
        if (!this.hiredisSocket.destroyed) {
          this.hiredisSocket.destroy();
        }
      })
      .on("close", hadError => {
        this.hiredisSocket = null;
        console.log("Disque connection was closed.");
      });

    if (this.password) {
      this.auth(this.password);
    }
  }

  send(args) {
    this.connect();
    return new Promise((resolve, reject) => {
      this.pendingOps.push({ resolve, reject });
      this.hiredisSocket.write.apply(this.hiredisSocket, args);
    });
  }

  auth(password) {
    return this.send(["AUTH", password]);
  }

  addjob(queue, job, timeout, options) {
    const cmd = ["ADDJOB", queue, job, timeout];
    if (options.retry) {
      cmd.push("RETRY", options.retry);
    }
    if (options.async) {
      cmd.push("ASYNC");
    }
    return this.send(cmd);
  }

  getjob(q, options) {
    let queues = q;
    if (!Array.isArray(q)) {
      queues = [q];
    }

    let cmd = ["GETJOB"];
    if (options.nohang) {
      cmd.push("NOHANG");
    }
    if (options.timeout) {
      cmd.push("TIMEOUT", options.timeout);
    }
    if (options.count) {
      cmd.push("COUNT", options.count);
    }
    if (options.withcounters) {
      cmd.push("WITHCOUNTERS");
    }
    cmd.push("FROM");
    cmd = cmd.concat(queues);
    return this.send(cmd);
  }

  ackjob(j) {
    let jobs;
    if (!Array.isArray(j)) {
      jobs = [j];
    }

    return this.send(["ACKJOB"].concat(jobs));
  }
}
