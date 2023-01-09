import moment from "moment";

import nsq from "../persistence/nsq";
import { logger } from "../logger";

/**
 * retraced exec processor /bin/bash
 *
 * make build
 * ./bin/processor email -p PROJECT -e ENVIRONMENT -r EMAIL_ADDRESS
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

export const handler = (argv) => {
  const jobBody = JSON.stringify({
    projectId: argv.projectId,
    projectName: argv.projectName,
    environmentId: argv.environmentId,
    environmentName: argv.environmentName,
    date: moment
      .utc()
      .add(argv.utcOffset, "minutes")
      .add(1, "day")
      .format("YYYY-MM-DD"),
    offset: argv.utcOffset,
    recipients: [{ email: argv.recipient, id: "test id", token: "fake-token" }],
  });
  logger.info(
    `scheduling analyze_day reporting job for environment ${
      argv.environmentId
    } at UTC offset ${argv.utcOffset} with recipients ${JSON.stringify([
      argv.recipient,
    ])}`
  );
  nsq.produce("environment_day", jobBody).catch((err) => logger.info(err));
  setTimeout(() => process.exit(0), 2000);
  return argv;
};
