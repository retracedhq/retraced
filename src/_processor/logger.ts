import config from "../config";
import { initLogger } from "../logger";

function initLoggerFromEnv(): any {
  return initLogger(config.RETRACED_PROCESSOR_LOG_FILE, config.LOG_LEVEL);
}

export const logger = initLoggerFromEnv();
