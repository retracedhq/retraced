import moment from "moment";

import { logger } from "../logger";
import { temporalClient } from "../persistence/temporal";
import { analyzeDayWorkflow } from "../workflows";

/**
 * retraced exec processor /bin/bash
 *
 * npm run build
 * node ./build/_processor/runner.js email -p PROJECT -e ENVIRONMENT -r EMAIL_ADDRESS
 */
export const name = "email";
export const describe = "compute and send emails";
export const builder = {
  email: {
    default: "daily",
  },
  projectId: {
    alias: "p",
    demand: true,
  },
  projectName: {
    default: "Test Project",
  },
  environmentId: {
    alias: "e",
    demand: true,
  },
  environmentName: {
    default: "Test Environment",
  },
  utcOffset: {
    default: -420, // PDT
    type: "number",
  },
  recipient: {
    alias: "r",
    describe: "email address of the receipient",
    demand: true,
  },
};

export const handler = async (argv) => {
  const jobBody = {
    projectId: argv.projectId,
    projectName: argv.projectName,
    environmentId: argv.environmentId,
    environmentName: argv.environmentName,
    date: moment.utc().add(argv.utcOffset, "minutes").add(1, "day").format("YYYY-MM-DD"),
    offset: argv.utcOffset,
    recipients: [{ email: argv.recipient, id: "test id", token: "fake-token" }],
  };

  logger.info(
    `scheduling analyze_day reporting job for environment ${argv.environmentId} at UTC offset ${
      argv.utcOffset
    } with recipients ${JSON.stringify([argv.recipient])}`
  );

  await temporalClient.start(analyzeDayWorkflow, {
    workflowId: `${argv.projectId}-${argv.environmentId}-${jobBody.date.toString()}`,
    taskQueue: "events",
    args: [jobBody],
  });

  setTimeout(() => process.exit(0), 2000);

  return argv;
};
