import moment from "moment";
import getViewerDescriptor from "../models/viewer_descriptor/get";
import nsq from "../persistence/nsq";
import { createViewerDescriptorVoucher } from "../security/vouchers";

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

  const job = JSON.stringify({
    taskId: crypto.randomUUID().replace(/-/g, ""),
    projectId: desc.projectId,
    environmentId: desc.environmentId,
    event: "viewer_session",
    timestamp: moment().valueOf(),
  });
  await nsq.produce("user_reporting_task", job);

  return {
    status: 200,
    body: JSON.stringify({
      project_id: desc.projectId,
      token: voucher,
    }),
  };
}
