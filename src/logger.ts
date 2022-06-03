import pino from "pino";
import fs from "fs";
import config from './config';

function initLoggerFromEnv(): any {
  if (config.RETRACED_API_LOG_FILE) {
    return pino(
        fs.createWriteStream(config.RETRACED_API_LOG_FILE),
    );
  }

  return pino();
}

export const logger = initLoggerFromEnv();

export function log(...msg: any[]) {
  logger.info(...msg);
}
