import { bootstrapProject } from "../headless";
import config from "../config";
import updateGeoData from "../_processor/workers/updateGeoData";
import getPgPool from "../_db/persistence/pg";
import { logger } from "../_processor/logger";

export const name = "bootstrap";
export const describe = "Bootstrap a retraced project with a specified projectId, environmentId, and apiKey";
export const builder = {
  projectId: {
    demand: true,
  },
  environmentId: {
    demand: true,
  },
  apiKey: {
    demand: true,
  },
  projectName: {
    demand: true,
  },
  environmentName: {
    default: "default",
  },
  tokenName: {
    default: "default",
  },
};

const sleep = async (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, time);
  });
};

export const handler = async (argv) => {
  const { projectId, apiKey, environmentId, projectName, environmentName, tokenName } = argv;

  do {
    try {
      await bootstrapProject({
        projectId,
        apiKey,
        environmentId,
        projectName,
        environmentName,
        tokenName,
        keyVarRef: "apiKey",
        projectVarRef: "projectId",
        envVarRef: "environmentId",
      });
      logger.info(`Bootstraped project ${argv.projectId}`);

      await startGeoSync();

      process.exit(0);
    } catch (ex) {
      logger.info("Retrying in 300ms", ex);
    } finally {
      await sleep(300);
    }
  } while (true);
};

const startGeoSync = async () => {
  const pgPool = getPgPool();
  const shouldSync = await pgPool.query("SELECT 1 FROM geoip LIMIT 1");
  if (
    !config.RETRACED_DISABLE_GEOSYNC &&
    config.GEOIPUPDATE_LICENSE_KEY &&
    shouldSync.rowCount === 0 &&
    !config.GEOIPUPDATE_USE_MMDB
  ) {
    await updateGeoData();
  }
};
