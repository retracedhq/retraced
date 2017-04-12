import * as hiredis from "hiredis";
import * as _ from "lodash";
import * as util from "util";
import { instrumented, meter, timer, histogram } from "monkit";

let sharedClient;

export default function getDisque() {
  if (!sharedClient) {
    sharedClient = DisqueClient.newClientFromEnv();
  }

  return sharedClient;
}

export class DisqueClient {

  public static newClientFromEnv(): DisqueClient {
    const nodes: any[] = [];
    _.split(process.env.DISQUE_NODES, ",").forEach((n) => {
      const parts = n.split(":");
      nodes.push({
        host: parts[0],
        port: parts[1],
      });
    });
    const password = process.env.DISQUE_PASSWORD;
    const circuitBreakerThreshold = process.env.DISQUE_CIRCUIT_BREAKER_THRESHOLD;
    return new DisqueClient(nodes, password, Number(circuitBreakerThreshold));
  }

  private nodes: any[];
  private password?: string;
  private hiredisSocket: any;
  private pendingOps: any[];
  private circuitBreakerThreshold: number;

  /**
   * @param nodes                   a list of {host, port} objects
   * @param password                optional disque password
   * @param circuitBreakerThreshold optional error threshold. If the percent of errors is higher than this value,
   *                                the connection will be destroyed and reconnected.
   *                                values outside the range [0, 1] will be ignored
   */
  constructor(nodes: any[], password?: string, circuitBreakerThreshold?: number) {
    this.nodes = nodes;
    this.password = password;
    this.circuitBreakerThreshold = circuitBreakerThreshold || -1;
  }

  @instrumented
  public async addjob(queue, job, timeout, options) {
    const cmd = ["ADDJOB", queue, job, timeout];
    if (options.retry) {
      cmd.push("RETRY", options.retry);
    }
    if (options.async) {
      cmd.push("ASYNC");
    }
    return this.send(cmd);
  }

  private async connect(): Promise<void> {
    if (this.hiredisSocket) {
      return;
    }

    console.log(`Opening new Disque connection to ${this.nodes[0].host}:${this.nodes[0].port}...`);

    this.hiredisSocket = hiredis.createConnection(this.nodes[0].port, this.nodes[0].host);
    this.pendingOps = [];
    this.hiredisSocket
      .on("reply", (data) => {
        if (data instanceof Error) {
          this.pendingOps.shift().reject(data);
          this.checkCircuitBreaker();
        } else {
          this.pendingOps.shift().resolve(data);
        }
      })
      .on("error", (err) => {
        console.log(`Disque connection failure: ${err.stack}`);
        if (!this.hiredisSocket.destroyed) {
          this.hiredisSocket.destroy();
        }
      })
      .on("close", (hadError) => {
        this.hiredisSocket = null;
        console.log("Disque connection was closed. `hadError` was ", hadError);
      });

    if (this.password) {
      await this.auth(this.password);
    }
  }

  @instrumented
  private async send(args): Promise<string> {
    this.connect();
    return new Promise<string>((resolve, reject) => {
      this.pendingOps.push({ resolve, reject });
      this.hiredisSocket.write.apply(this.hiredisSocket, args);
    });
  }

  private async auth(password) {
    return this.send(["AUTH", password]);
  }

  // we maybe want to use something like hystrixjs,
  // but it seems a little heavy for what we need at this point.
  private checkCircuitBreaker() {
    const shouldCheck =
        this.circuitBreakerThreshold >= 0 &&
        this.circuitBreakerThreshold <= 1 &&
        !this.hiredisSocket.destroyed;

    if (!shouldCheck) {
      return;
    }

    const errorPct = this.computeErrorPercentage();
    histogram("DisqueClient.send.errorPct").update(errorPct);

    if (errorPct > this.circuitBreakerThreshold) {
      this.forceReconnect(errorPct);
    }
  }

  private computeErrorPercentage() {
    const errorRate = meter("DisqueClient.send.errors").fifteenMinuteRate();
    const callRate  = timer("DisqueClient.send.timer").fifteenMinuteRate();
    const errorPct = callRate ? (errorRate / callRate) : 0;
    return errorPct;
  }

  /**
   * Destroy the disque socket, forcing a reconnect
   * on the next operation.
   */
  private forceReconnect(errorPct: number) {
      console.log(`Error Percentage ${errorPct} is greater than threshold` +
                  `${this.checkCircuitBreaker}, reconnecting to disque at` +
                  `${util.inspect(this.nodes[0])}`);
      meter("DisqueClient.forceReconnect.destroy").mark();
      if (!this.hiredisSocket.destroyed) {
        this.hiredisSocket.destroy();
      }
  }
}
