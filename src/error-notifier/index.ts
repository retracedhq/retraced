import { start as startBugsnag, notify as notifyBugsnag } from "./bugsnag";

import config from "../config";

export const startErrorNotifier = (expressMiddleware = false) => {
  startBugsnag(config.BUGSNAG_TOKEN, config.STAGE, expressMiddleware);
  return !!config.BUGSNAG_TOKEN;
};

export const notifyError = (err) => {
  notifyBugsnag(err);
};
