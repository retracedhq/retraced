import pino from "pino";
import fs from "fs";
import config from "./config";

export function initLogger(logFile?: string, logLevel?: string): any {
  if (logFile) {
    return pino(fs.createWriteStream(logFile));
  }

  const p = pino();
  p.level = logLevel || "warn";
  return p;
}

function initLoggerFromEnv(): any {
  return initLogger(config.RETRACED_API_LOG_FILE, config.LOG_LEVEL);
}

export const logger = initLoggerFromEnv();
