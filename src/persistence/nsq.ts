import "source-map-support/register";
import * as nsq from "nsqjs";
import * as chalk from "chalk";

export class NSQClient {
  public static fromEnv() {
    return new NSQClient(process.env.NSQD_HOST, process.env.NSQD_TCP_PORT);
  }

  private writer: Promise<any>;

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {}

  public connect() {
    this.writer = new Promise((resolve, reject) => {
      const w = new nsq.Writer(this.host, this.port);

      w.connect();
      w.on("ready", () => {
        resolve(w);
      });
      w.on("error", (err) => {
        console.log(chalk.yellow(`NSQ writer ${this.host}:${this.port} : ${err.message}`));
        reject(err); // no-op if already resolved
      });
    });
  }

  public produce(topic: string, body: string) {
    if (!this.writer) {
      this.connect();
    }
    return this.writer.then((w) => {
      return new Promise((resolve, reject) => {
        w.publish(topic, body, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }
}

let client;

export default {
  produce: (topic: string, body: string) => {
    if (!client) {
      client = NSQClient.fromEnv();
    }
    return client.produce(topic, body);
  },
};
