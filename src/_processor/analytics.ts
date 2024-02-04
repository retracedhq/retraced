import Mixpanel from "mixpanel";
import { randomUUID } from "crypto";
import { getAnalyticsId, updateAnalyticsId, updateRunAt } from "../models/analytics";

const idKey = "heartbeat";

export class AnalyticsController {
  client: Mixpanel.Mixpanel;
  anonymousId: string;

  constructor() {
    this.client = Mixpanel.init("bc2087771b373887f3a7f28ef40dbb9f");
    this.anonymousId = "";
  }

  public async init(): Promise<void> {
    const { uuid, sent } = await getAnalyticsId();
    this.anonymousId = uuid;

    if (!this.anonymousId || this.anonymousId === "") {
      this.anonymousId = randomUUID();
      await updateAnalyticsId(this.anonymousId);
    }

    const msBetweenDates = Math.abs(new Date().getTime() - new Date(sent || 0).getTime());
    const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000);

    if (hoursBetweenDates >= 24) {
      this.send();
    }

    setInterval(
      () => {
        this.send();
      },
      60 * 60 * 24 * 1000
    );
  }

  send() {
    try {
      this.client.track(
        idKey,
        {
          distinct_id: this.anonymousId,
        },
        (err: Error | undefined) => {
          if (err) {
            setTimeout(
              () => {
                this.send();
              },
              1000 * 60 * 60
            );
            return;
          }

          updateRunAt(new Date().toISOString());
        }
      );
    } catch (err) {
      console.error("Error sending analytics", err);
    }
  }
}
