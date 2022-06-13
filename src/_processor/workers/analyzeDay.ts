import "source-map-support/register";
import moment from "moment";
import util from "util";
import countActions from "../models/active_actor/count";
import selectNewActions from "../models/action/select_new";
import selectStoppedActions from "../models/action/select_stopped";
import selectTopActors from "../models/active_actor/select_top";
import selectTopGroups from "../models/active_group/select_top";
import { EnvironmentTimeRange } from "../common";
import { Emailer } from "../services/Emailer";
import { logger } from "../logger";
import config from "../../config";

interface Opts {
  projectId: string;
  projectName: string;
  environmentId: string;
  environmentName: string;
  // yyyy-mm-dd
  date: string;
  // minutes
  offset: number;
  recipients: Array<{
    email: string;
    id: string;
    token: string;
  }>;
}

export default async function analyzeDay(job) {
  const opts: Opts = JSON.parse(job.body);
  const start = moment.utc(opts.date).add(opts.offset, "minutes");
  const envDay: EnvironmentTimeRange = {
    projectId: opts.projectId,
    environmentId: opts.environmentId,
    range: [start, start.clone().add(1, "day")],
  };
  const priorDay: EnvironmentTimeRange = {
    projectId: opts.projectId,
    environmentId: opts.environmentId,
    range: [start.clone().subtract(1, "day"), start],
  };

  const stat = {
    count: (await countActions(envDay)).toLocaleString(), // might want to pull in the recipient's locale
    newActions: await selectNewActions(envDay),
    stoppedActions: await selectStoppedActions(priorDay),
    topActors: await selectTopActors(envDay),
    topGroups: await selectTopGroups(envDay),
  };

  const recipients = opts.recipients.map((recipient) => {
    return {
      ...recipient,
      unsubscribe: `${config.RETRACED_API_BASE}/admin/v1/environment/${opts.environmentId}/user/${recipient.id}/unsubscribe/daily?token=${recipient.token}`,
    };
  });

  const context = {
    count: stat.count,
    newActions: stat.newActions,
    stoppedActions: stat.stoppedActions,
    topActors: stat.topActors,
    topGroups: stat.topGroups,
  };

  logger.info(`analyze_day job completed for ${opts.environmentId} ${opts.date} ${opts.offset}: ${JSON.stringify(context)}`);

  // TODO(areed) schedule for 7AM
  Emailer.getDefault().send({
    context,
    template: "retraced/report-day",
    subject: "Retraced Daily Report",
    to: recipients.map(({ email }) => email),
  }).catch((e) => {
    logger.error(util.inspect(e));
    throw e;
  });
}
