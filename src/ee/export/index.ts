import axios from "axios";
import config from "../../config";
import { logger } from "../../logger";

export default async function sendToWebhook(event: any): Promise<void> {
  if (config.EXPORT_VECTOR_WEBHOOK_URL) {
    delete event.raw;
    axios
      .post(
        config.EXPORT_VECTOR_WEBHOOK_URL,
        {
          message: JSON.stringify(event),
        },
        {
          auth:
            config.EXPORT_VECTOR_WEBHOOK_USERNAME && config.EXPORT_VECTOR_WEBHOOK_PASSWORD
              ? {
                  username: config.EXPORT_VECTOR_WEBHOOK_USERNAME,
                  password: config.EXPORT_VECTOR_WEBHOOK_PASSWORD,
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
