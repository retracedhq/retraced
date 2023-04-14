import moment from "moment";
import _ from "lodash";

import { offsetsWithLocalTimeDuringUTCHour } from "../common";
import environmentDailyReports from "../models/environment/daily_report";
import { logger } from "../logger";
import { analyzeDayWorkflow } from "../temporal/workflows";
import { createWorkflowId } from "../temporal/helper";
import getTemporalClient from "../persistence/temporal";

const reportDueLocalHour = 7;

export default async function scheduleDailyReportsDue() {
  // Example: if it's 23:15UTC the next UTC hour is 0.
  const nextUTCHour = (moment.utc().hours() + 1) % 24;
  const offsetHours = offsetsWithLocalTimeDuringUTCHour(nextUTCHour, reportDueLocalHour);
  const results = await Promise.all(
    offsetHours.map(async (offsetHour) => {
      return await environmentDailyReports({ offsetHour });
    })
  );

  for (const r of _.flatten(results)) {
    const job = {
      projectId: r.project_id,
      projectName: r.project_name,
      environmentId: r.environment_id,
      environmentName: r.environment_name,
      date: moment.utc().add(r.utc_offset, "minutes").subtract(1, "day").format("YYYY-MM-DD"),
      offset: r.utc_offset,
      recipients: r.recipients,
    };

    logger.info(
      `scheduling environment_day reporting job for environment ${r.environment_id} at UTC offset ${
        r.utc_offset
      } with recipients ${JSON.stringify(r.recipients.map(({ email }) => email))}`
    );

    const temporalClient = await getTemporalClient();

    await temporalClient.workflow.start(analyzeDayWorkflow, {
      workflowId: createWorkflowId(),
      taskQueue: "events",
      args: [job],
    });
  }
}
