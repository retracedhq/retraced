import nsq from "nsqjs";
import { histogram, instrumented, meter, timer } from "../metrics";
import otel from "@opentelemetry/api";
import { logger } from "../logger";
import config from "../config";

const otelMeter = otel.metrics.getMeter("retraced-meter");

export class NSQClient {
  public static fromEnv() {
    const circuitBreakerThreshold = config.NSQ_CIRCUIT_BREAKER_THRESHOLD;
    return new NSQClient(
      config.NSQD_HOST || "",
      Number(config.NSQD_TCP_PORT),
      Number(circuitBreakerThreshold)
    );
  }

  private writer?: Promise<any>;

  /**
   * host                    nsqd hostname
   * port                    nsqd tcp port
   * circuitBreakerThreshold optional error threshold. If the percent of errors is higher than this value,
   * the connection will be destroyed and reconnected.
   * values outside the range [0, 1] will be ignored
   */
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly circuitBreakerThreshold: number
  ) {
    this.circuitBreakerThreshold = circuitBreakerThreshold || -1;
  }

  @instrumented
  public produce(topic: string, body: string): Promise<void> {
    const writer = this.writer || this.connect();

    return writer.then((w: any) => {
      return new Promise<void>((resolve, reject) => {
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

  // we maybe want to use something like hystrixjs,
  // but it seems a little heavy for what we need at this point.
  private checkCircuitBreaker() {
    const shouldCheck = this.circuitBreakerThreshold >= 0 && this.circuitBreakerThreshold <= 1;

    if (!shouldCheck) {
      return;
    }

    const errorPct = this.computeErrorPercentage();
    otelMeter.createHistogram("NSQClient.produce.errorPct").record(errorPct);
    histogram("NSQClient.produce.errorPct").update(errorPct);

    if (errorPct > this.circuitBreakerThreshold) {
      this.forceReconnect(errorPct);
    }
  }

  private computeErrorPercentage() {
    const errorRate = meter("NSQClient.produce.errors").fifteenMinuteRate();
    const callRate = timer("NSQClient.produce.timer").fifteenMinuteRate();
    const errorPct = callRate ? errorRate / callRate : 0;
    return errorPct;
  }

  // Destroy the writer, forcing a reconnect on the next produce operation.
  private forceReconnect(errorPct: number) {
    logger.warn(
      `Error Percentage ${errorPct} is greater than threshold` +
        `${this.circuitBreakerThreshold}, reconnecting to nsq at` +
        `${this.host}:${this.port}`
    );
    if (this.writer) {
      this.writer.then((w) => w.close());
      delete this.writer;
    }
    otelMeter.createCounter("NSQClient.forceReconnect.destroy").add(1);
    meter("NSQClient.forceReconnect.destroy").mark();
  }

  private connect() {
    this.writer = new Promise((resolve, reject) => {
      const w = new nsq.Writer(this.host, this.port);
      let connected = false;

      w.connect();
      logger.info(`NSQ writer attempting to connect to nsqd at ${this.host}:${this.port}`);

      w.on("ready", () => {
        connected = true;
        resolve(w);
        logger.info(`NSQ writer connected to ${this.host}:${this.port}`);
      });
      w.on("closed", () => {
        logger.warn(`NSQ writer disconnected from ${this.host}:${this.port}`);
        connected = false;
        delete this.writer;
      });
      w.on("error", (err) => {
        logger.info(`NSQ writer ${this.host}:${this.port} : ${err.message}`);
        if (connected) {
          this.checkCircuitBreaker();
        } else {
          reject(err);
        }
      });
    });

    return this.writer;
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
