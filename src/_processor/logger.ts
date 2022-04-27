import { pino } from "pino";
import * as fs from "fs";
import * as process from "process";

function initLoggerFromEnv(): any {
  let p;
  if (process.env.RETRACED_PROCESSOR_LOG_FILE) {
    p = pino(
        fs.createWriteStream(process.env.RETRACED_PROCESSOR_LOG_FILE),
    );
  } else {
    p = pino();
  }

  p.level = process.env["LOG_LEVEL"] || "warn";
  return p;
}

export const logger = initLoggerFromEnv();

export function log(...msg: any[]) {
  logger.info(...msg);
}
