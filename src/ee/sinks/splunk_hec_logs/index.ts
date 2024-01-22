import axios from "axios";
import { randomUUID } from "crypto";
import { sleep } from "../../sidecar/services/helper";
import { logger } from "../../../logger";
import { WithExponentialBackoff } from "../classes";
import { Sink } from "../interfaces";

export class SplunkHecLogs extends WithExponentialBackoff implements Sink {
  private endpoint: string;
  private defaultToken: string;
  private indexingAckEnabled: boolean;

  constructor(opts: { defaultToken: string; endpoint: string; indexingAckEnabled?: boolean }) {
    super();
    if (!opts.endpoint) {
      throw new Error("endpoint is required");
    }
    if (!opts.defaultToken) {
      throw new Error("defaultToken is required");
    }
    this.indexingAckEnabled = opts.indexingAckEnabled ? opts.indexingAckEnabled : false;
    this.endpoint = opts.endpoint;
    this.defaultToken = opts.defaultToken;
  }

  /**
   * Checks the health of the Splunk HEC endpoint.
   * @returns A promise that resolves to true if the health check is successful, or rejects with an error if it fails.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.endpoint}/services/collector/health/1.0`,
      };
      const response = await axios.request(config);

      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.info(error ? error.message : "Something went wrong with the health check");
      return false;
    }
  }

  /**
   * Transforms a single event into the expected format.
   * @param event The event to transform.
   * @param batched Indicates whether the event is part of a batch.
   * @returns The transformed event.
   */
  public transformEvent(event: any, batched = false): any {
    if (batched) {
      return event.map((e) => JSON.stringify({ event: e })).join("\n");
    } else {
      return {
        event,
      };
    }
  }

  /**
   * Sends a single event to the Splunk HEC endpoint.
   * @param event The event to send.
   * @returns A promise that resolves to true if the event is successfully sent and indexed, or false otherwise.
   */
  public async sendEvent(event: any): Promise<boolean> {
    if (!event) {
      throw new Error("event is required");
    }
    let backoff = 100;
    do {
      try {
        const transformedEvent = this.transformEvent(event);
        const channel = this.indexingAckEnabled ? randomUUID() : undefined;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Splunk ${this.defaultToken}`,
          "X-Splunk-Request-Channel": channel,
        };
        const response = await axios.post(`${this.endpoint}/services/collector/event`, transformedEvent, {
          headers,
        });
        if (response.status === 200) {
          return true;
        } else {
          await sleep(backoff);
          backoff = this.getNextExponentialBackoff(backoff);
        }
      } catch (ex) {
        await sleep(backoff);
        backoff = this.getNextExponentialBackoff(backoff);
      }
    } while (true);
  }

  /**
   * Sends multiple events to the Splunk HEC endpoint.
   * @param events The events to send.
   * @returns A promise that resolves to true if all events are successfully sent and indexed, or false otherwise.
   */
  public async sendEvents(events: any[], batchSize = 100): Promise<boolean> {
    if (!events || !Array.isArray(events)) {
      throw new Error("events must be an array");
    }
    if (events.length === 0) {
      return true;
    }
    const batchedEvents = this.getBatchedEvents(events, batchSize);
    let index = 0;
    const channel = this.indexingAckEnabled ? randomUUID() : undefined;
    const headers = {
      Authorization: `Splunk ${this.defaultToken}`,
      "X-Splunk-Request-Channel": channel,
    };
    let backoff = 100;
    logger.info(
      `Sending batch${this.indexingAckEnabled ? `(${channel})` : ""} of ${batchedEvents.length} batches and ${
        events.length
      } events to Splunk`
    );
    do {
      try {
        const transformedEvent = this.transformEvent(batchedEvents[index], true);
        const response = await axios.post(`${this.endpoint}/services/collector/event`, transformedEvent, {
          headers,
        });

        if (response.status === 200) {
          logger.info(`Batch ${index} of ${batchedEvents[index].length} events sent to Splunk`);
          backoff = 100;
          await sleep(backoff);
          index++;
        } else {
          logger.info(`Splunk HEC returned status code ${response.status}. Retrying in ${backoff}ms...`);
          await sleep(backoff);
          backoff = this.getNextExponentialBackoff(backoff);
        }
      } catch (ex) {
        logger.info(`Splunk HEC returned status code ${ex.response.status}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
        backoff = this.getNextExponentialBackoff(backoff);
      }
    } while (index < batchedEvents.length);
    logger.info(
      `Batch${this.indexingAckEnabled ? `(${channel})` : ""} of ${events.length} events sent to Splunk`
    );
    return true;
  }

  /**
   * Splits an array of events into batches of a specified size.
   * @param {any[]} events - The array of events to be batched.
   * @param {number} batchSize - The size of each batch.
   * @returns {any[]} - An array of batches.
   */
  private getBatchedEvents(events: any[], batchSize: number): any[] {
    const batchedEvents: any[] = [];
    for (let i = 0; i < events.length; i += batchSize) {
      batchedEvents.push(events.slice(i, i + batchSize));
    }
    return batchedEvents;
  }
}
