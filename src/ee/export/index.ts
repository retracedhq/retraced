import axios from "axios";
import config from "../../config";
import { logger } from "../../logger";

export default function sendToWebhook(
  event: any,
  eventInfo: {
    project_id: string;
    environment_id: string;
  }
): void {
  if (config.EXPORT_WEBHOOK_URL) {
    delete event.raw;
    axios
      .post(
        config.EXPORT_WEBHOOK_URL,
        {
          message: JSON.stringify({ ...event, ...eventInfo }),
        },
        {
          auth:
            config.EXPORT_WEBHOOK_USERNAME && config.EXPORT_WEBHOOK_PASSWORD
              ? {
                  username: config.EXPORT_WEBHOOK_USERNAME,
                  password: config.EXPORT_WEBHOOK_PASSWORD,
                }
              : undefined,
        }
      )
      .catch(() => {
        logger.info(`[VECTOR EXPORT] Failed to send to webhook`);
      })
      .then(() => {
        logger.info(`[VECTOR EXPORT] Sent to webhook`);
      });
  }
}
