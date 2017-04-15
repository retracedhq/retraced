/*
 * Handler for email opt-out links.
 * Should support anonymous GET requests authorized by querystring token.
 */
import getEnvUser from "../../models/environmentuser/get";
import updateEnvUser from "../../models/environmentuser/update";

const unsubDailyURL = "https://www.retraced.io/unsubscribed/daily-reports/";
const unsubAnomalyURL = "https://www.retraced.io/unsubscribed/anomaly-reports/";

export default async function(req) {
  const envUser = await getEnvUser({
    environment_id: req.params.environmentId,
    user_id: req.params.userId,
  });

  if (!envUser) {
    return {
      status: 404,
    };
  }
  if (envUser.email_token !== req.query.token) {
    return {
      status: 401,
    };
  }

  await updateEnvUser({
    user_id: req.params.userId,
    environment_id: req.params.environmentId,
    daily_report: req.params.report === "daily" ? false : envUser.daily_report,
    anomaly_report: req.params.report === "anomaly" ? false : envUser.anomaly_report,
  });

  return {
    status: 301,
    headers: {
      Location: req.params.report === "daily" ? unsubDailyURL : unsubAnomalyURL,
    },
  };
}
