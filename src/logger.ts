import pino from "pino";
import fs from "fs";

function initLoggerFromEnv(): any {
  if (process.env.RETRACED_API_LOG_FILE) {
    return pino(
        fs.createWriteStream(process.env.RETRACED_API_LOG_FILE),
    );
  }

  return pino();
}

export const logger = initLoggerFromEnv();

export function log(...msg: any[]) {
  logger.info(...msg);
}
