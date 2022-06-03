import "source-map-support/register";
import nsq from "nsqjs";
import request from "request";
import { logger } from "../logger";
import config from '../../config';

interface Message {
  timestamp: number;
  attempts: number;
  id: string;
  hasResponded: boolean;
  body: Buffer;
  json: () => any;
  timeUntilTimeout: (hard: boolean) => number;
  finish: () => void;
  requeue: (delay?: null|number, backoff?: boolean) => void;
  touch: () => void;
}

// The subset of reader options exposed to the application
// https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
interface ConsumerOptions {
  maxAttempts: number;
  maxInFlight: number;
  messageTimeoutMS: number;
}

export interface NSQ {
  produce: (topic: string, body: string) => Promise<void>;
  consume: (
    topic: string,
    channel: string,
    handler: (Message) => void,
    opts: ConsumerOptions,
  ) => void;
  deleteTopic: (topic: string) => Promise<void>;
}

export class NSQClient {
  public static fromEnv(): NSQClient {
    return new NSQClient(config.NSQD_HOST || "", Number(config.NSQD_TCP_PORT) || 4150, Number(config.NSQD_HTTP_PORT) || 4151);
  }

  private readonly nsqdTCPAddresses: string[];
  private writer?: Promise<any>;

  constructor(
    private readonly host: string,
    private readonly tcpPort: number,
    private readonly httpPort: number,
  ) {
    this.nsqdTCPAddresses = [`${host}:${tcpPort}`];
  }

  public connect(): Promise<any> {
    this.writer = new Promise((resolve, reject) => {
      const w = new nsq.Writer(this.host, this.tcpPort);

      w.connect();
      w.on("ready", () => {
        logger.info(`NSQ writer connected to ${this.host}:${this.tcpPort}`);
        resolve(w);
      });
      w.on("closed", () => {
        logger.error(`NSQ writer disconnected from ${this.host}:${this.tcpPort}`);
        delete this.writer;
      });
      w.on("error", (err) => {
        logger.error(`NSQ writer ${this.host}:${this.tcpPort} : ${err.message}`);
        reject(err); // no-op if already resolved
      });
    });

    return this.writer;
  }

  public consume(
    topic: string,
    channel: string,
    handle: (msg: Message) => void,
    opts: ConsumerOptions,
  ) {
    // nsqjs passes to discard handler on attempt == maxAttempts, but expect
    // to wait until attempt > maxAttempts.
    const config = {
      maxAttempts: opts.maxAttempts + 1,
      messageTimeout: opts.messageTimeoutMS,
      maxInFlight: opts.maxInFlight,
      nsqdTCPAddresses: this.nsqdTCPAddresses,
    };
    const reader = new nsq.Reader(topic, channel, config);

    reader.connect();
    reader.on("error", (err) => {
      logger.warn(`NSQ consumer ${topic}.${channel}: ${err.message}`);
    });
    reader.on("discard", (msg) => {
      logger.warn(`NSQ discarding message on ${topic}.${channel} after ${opts.maxAttempts} attempts`);
    });
    reader.on("nsqd_connected", () => {
      logger.info(`NSQ consumer ${topic}:${channel} connected to ${this.host}:${this.tcpPort}`);
    });
    reader.on("nsqd_closed", () => {
      logger.warn(`NSQ consumer ${topic}:${channel} disconnected from ${this.host}:${this.tcpPort}`);
      // The closed event is limited by the heartbeat of 30s, so no need for backoff
      this.consume(topic, channel, handle, opts);
    });
    reader.on("message", handle);
  }

  public produce(topic: string, body: string): Promise<void> {
    const writer = this.writer || this.connect();

    return writer.then((w: any) => {
      return new Promise<void>((resolve, reject) => {
        w.publish(topic, body, (err) => {
          if (err) {
            delete this.writer;
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  public deleteTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      request({
        method: "POST",
        uri: `http://${this.host}:${this.httpPort}/topic/delete?topic=${topic}`,
      }, (err, resp, body) => {
        if (err) {
          reject(err);
          return;
        }
        if ((resp.statusCode! < 200 || resp.statusCode! >= 300)
          && resp.statusCode !== 404) {
          reject(body);
          return;
        }
        resolve();
      });
    });
  }
}

let client;

export default {
  produce(topic: string, body: string): Promise<void> {
    if (!client) {
      client = NSQClient.fromEnv();
    }
    return client.produce(topic, body) as Promise<void>;
  },
  consume: (
    topic: string,
    channel: string,
    handler: (Message) => void,
    opts: ConsumerOptions,
  ) => {
    if (!client) {
      client = NSQClient.fromEnv();
    }
    client.consume(topic, channel, handler, opts);
  },
  deleteTopic: (topic: string) => {
    if (!client) {
      client = NSQClient.fromEnv();
    }
    return client.deleteTopic(topic);
  },
};
