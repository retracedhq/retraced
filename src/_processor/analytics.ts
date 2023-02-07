import Mixpanel from "mixpanel";
import { randomUUID } from "crypto";
import { getAnalyticsId, createAnalyticsId, updateRunAt } from "../models/analytics";

const idKey = "heartbeat";

export class AnalyticsController {
  client: Mixpanel.Mixpanel;
  anonymousId: string;

  constructor() {
    this.client = Mixpanel.init("bc2087771b373887f3a7f28ef40dbb9f");
    this.anonymousId = "";
  }

  public async init(): Promise<void> {
    const { name, sent } = await getAnalyticsId();
    this.anonymousId = name;
    console.log("this.anonymousId", this.anonymousId);
    if (!this.anonymousId || this.anonymousId === "") {
      this.anonymousId = randomUUID();
      await createAnalyticsId(this.anonymousId);
      console.log("saving this.anonymousId", this.anonymousId);
    }

    console.log("sent:", sent);
    const msBetweenDates = Math.abs(new Date().getTime() - new Date(sent || 0).getTime());
    const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000);

    console.log("hoursBetweenDates", hoursBetweenDates);

    if (hoursBetweenDates >= 24) {
      await this.send();
    }

    setInterval(async () => {
      await this.send();
    }, 60 * 60 * 24 * 1000);
  }

  async send() {
    try {
      this.client.track(
        idKey,
        {
          distinct_id: this.anonymousId,
        },
        (err: Error | undefined) => {
          if (err) {
            setTimeout(() => {
              this.send();
            }, 1000 * 60 * 60);
            return;
          }

          console.log("writing date");
          updateRunAt(new Date().toISOString());
          console.log("wrote date");
        }
      );
    } catch (err) {
      console.error("Error sending analytics", err);
    }
  }
}
