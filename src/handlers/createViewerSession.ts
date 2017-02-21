import * as uuid from "uuid";
import * as moment from "moment";
import * as jwt from "jsonwebtoken";

import ViewerDescriptor from "../models/viewer_descriptor/def";
import getViewerDescriptor from "../models/viewer_descriptor/get";
import getDisque from "../persistence/disque";
import { createViewerDescriptorVoucher } from "../security/vouchers";

const disque = getDisque();

export default async function handler(req) {
  // Note that, because these "viewer descriptor" values are being read from redis,
  // all of the values are JSON strings, not their normal expected types.
  // Clients must be prepared to deal with string values.  
  const desc = await getViewerDescriptor({
    id: req.body.token,
  });

  const voucher = createViewerDescriptorVoucher(desc);

  const job = JSON.stringify({
    taskId: uuid.v4().replace(/-/g, ""),
    projectId: desc.projectId,
    environmentId: desc.environmentId,
    event: "viewer_session",
    timestamp: moment().valueOf(),
  });
  const opts = {
    retry: 600, // seconds
    async: true,
  };
  disque.addjob("user_reporting_task", job, 0, opts);

  return {
    status: 200,
    body: JSON.stringify({
      project_id: "",
      token: voucher,
    }),
  };
}
