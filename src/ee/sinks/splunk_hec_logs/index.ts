import { Sink } from "../";
import axios from "axios";
import { Logger } from "splunk-logging";

export class SplunkHecLogs implements Sink {
  private endpoint: string;
  private defaultToken: string;
  private logger: Logger;

  constructor(opts: { defaultToken: string; endpoint: string }) {
    if (!opts.endpoint) {
      throw new Error("endpoint is required");
    }
    if (!opts.defaultToken) {
      throw new Error("defaultToken is required");
    }
    this.endpoint = opts.endpoint;
    this.defaultToken = opts.defaultToken;
    const url = new URL(this.endpoint);
    let port = url.protocol === "https:" ? 443 : 80;
    if (url.port) {
      port = parseInt(url.port);
    }
    this.logger = new Logger({
      token: this.defaultToken,
      url: url.href,
      port,
    });
  }

  public async healthCheck(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.endpoint}/services/collector/health/1.0`,
      };
      axios
        .request(config)
        .then((response) => {
          console.log(JSON.stringify(response.data));
          resolve(true);
        })
        .catch((error) => {
          console.log(error);
          resolve(false);
        });
    });
  }

  public transformEvent(event: any): any {
    return {
      message: event,
    };
  }

  public async sendEvent(event: any): Promise<boolean> {
    return new Promise<any>((resolve, reject) => {
      const transformedEvent = this.transformEvent(event);
      this.logger.send(transformedEvent, (err, resp, body) => {
        console.log("body", body);
        if (err) {
          reject(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public sendEvents(events: any[]): Promise<void> {
    throw new Error("Not implemented");
  }
}
