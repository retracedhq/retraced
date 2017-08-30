import * as pino from "pino";
import * as fs from "fs";

function initLoggerFromEnv(): any {
  if (process.env.RETRACED_API_LOG_FILE) {
    return pino(
        fs.createWriteStream(process.env.RETRACED_API_LOG_FILE),
    ).child({
      tier: "api",
    });
  }

  return pino().child({
    tier: "api",
  });
}

export const logger = initLoggerFromEnv();

export function log(...msg: any[]) {
  logger.info(...msg);
}
