/*
 * Handler for email opt-out links.
 * Should support anonymous GET requests authorized by querystring token.
 */
import getEnvUser from "../../models/environmentuser/get";
import updateEnvUser from "../../models/environmentuser/update";

const unsubURL = "https://www.retraced.io/unsubscribed/daily-reports/";

export default async function (req) {
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
    daily_report: false,
  });

  // redirect to app
  return {
    status: 301,
    headers: {
      Location: unsubURL,
    },
  };
}
