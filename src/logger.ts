import * as pino from "pino";
import * as fs from "fs";

function initLoggerFromEnv(): any {
  if (process.env.RETRACED_API_LOG_FILE) {
    return pino(
        fs.createWriteStream(process.env.RETRACED_API_LOG_FILE),
    );
  }

  return pino({level: process.env.LOG_LEVEL});
}

export const logger = initLoggerFromEnv();

export function log(...msg: any[]) {
  logger.info(...msg);
}
