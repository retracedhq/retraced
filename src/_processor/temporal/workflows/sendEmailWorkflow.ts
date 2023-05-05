import { proxyActivities } from "@temporalio/workflow";

import type { Email } from "../../services/Emailer";
import type * as activities from "../../workers";

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function sendEmailWorkflow(email: Email) {
  await sendEmail(email);
}
