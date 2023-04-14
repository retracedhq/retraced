import * as uuid from "uuid";
import moment from "moment";

import getViewerDescriptor from "../models/viewer_descriptor/get";
import { createViewerDescriptorVoucher } from "../security/vouchers";
import getTemporalClient from "../persistence/temporal";
import { createWorkflowId } from "../_processor/temporal/helper";
import { saveUserReportingEventWorkflow } from "../_processor/temporal/workflows";

export default async function handler(req) {
  // Note that, because these "viewer descriptor" values are being read from redis,
  // all of the values are JSON strings, not their normal expected types.
  // Clients must be prepared to deal with string values.
  const desc = await getViewerDescriptor({
    id: req.body.token,
  });

  if (!desc) {
    throw { status: 401, err: new Error("Unauthorized") };
  }

  desc.ip = req.ip;

  const voucher = createViewerDescriptorVoucher(desc);

  const job = {
    taskId: uuid.v4().replace(/-/g, ""),
    projectId: desc.projectId,
    environmentId: desc.environmentId,
    event: "viewer_session",
    timestamp: moment().valueOf(),
  };

  const temporalClient = await getTemporalClient();

  try {
    await temporalClient.workflow.start(saveUserReportingEventWorkflow, {
      workflowId: createWorkflowId(),
      taskQueue: "events",
      args: [job],
    });
  } catch (err) {
    console.log("Error starting workflow: saveUserReportingEventWorkflow " + err.message);
    console.error(err);
  }

  return {
    status: 200,
    body: JSON.stringify({
      project_id: desc.projectId,
      token: voucher,
    }),
  };
}
