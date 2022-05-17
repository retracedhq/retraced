import { bootstrapProject } from "../headless";
import util from "util";

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

export const handler = async (argv) => {
  const { projectId, apiKey, environmentId, projectName, environmentName, tokenName } = argv;
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
        console.log(`bootstrapped project ${argv.projectId}`);
        process.exit(0);
      })
      .catch((err) => {
        console.log(util.inspect(err));
        process.exit(1);
      });
};
