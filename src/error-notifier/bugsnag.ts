import Bugsnag from "@bugsnag/js";
import BugsnagPluginExpress from "@bugsnag/plugin-express";

import { logger } from "../logger";

let init = false;

export const start = (token, stage, expressMiddleware = false) => {
  if (!token) {
    logger.error("BUGSNAG_TOKEN not set, error reports will not be sent to bugsnag");
  } else {
    Bugsnag.start({
      apiKey: token || "",
      plugins: expressMiddleware ? [BugsnagPluginExpress] : [],
      releaseStage: stage || "",
      enabledReleaseStages: ["production", "staging"],
    });

    init = true;
  }
};

export const notify = (err) => {
  if (init) {
    Bugsnag.notify(err);
  }
};
