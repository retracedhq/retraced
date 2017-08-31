import { bootstrapProject } from "../headless";
import * as util from "util";
import { logger } from "../logger";

exports.name = "bootstrap";
exports.describe = "Bootstrap a retraced project with a specified projectId, environmentId, and apiKey";
exports.builder = {
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

exports.handler = async (argv) => {
  const {projectId, apiKey, environmentId, projectName, environmentName, tokenName } = argv;
  bootstrapProject({
    projectId,
    apiKey,
    environmentId,
    projectName,
    environmentName,
    tokenName,
    keyVarRef: "apiKey",
    projectVarRef: "projectId",
    envVarRef: "environmentId",
  })
    .then(() => {
      logger.info(`bootstrapped project ${argv.projectId}`);
      process.exit(0);
    })
    .catch((err) => {
      logger.error(util.inspect(err));
      process.exit(1);
    });
};
