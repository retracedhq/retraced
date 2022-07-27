import { pino } from "pino";
import fs from "fs";
import config from "../config";

function initLoggerFromEnv(): any {
  let p;
  if (config.RETRACED_PROCESSOR_LOG_FILE) {
    p = pino(
        fs.createWriteStream(config.RETRACED_PROCESSOR_LOG_FILE),
    );
  } else {
    p = pino();
  }

  p.level = config.LOG_LEVEL || "warn";
  return p;
}

export const logger = initLoggerFromEnv();

export function log(...msg: any[]) {
  logger.info(...msg);
}
