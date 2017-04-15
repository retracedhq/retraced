import * as moment from "moment";

import { checkAdminAccess } from "../../security/helpers";

import { DashboardTile, DashboardOptions } from "../../dashboard/interfaces";
import getActionsTile from "../../dashboard/actions/top";
import getGroupsTile from "../../dashboard/groups/top";

export default async function(req) {
  await checkAdminAccess(req);

  // This is hard coded for now.  TODO, we should consider making this
  // all stored in the db so that a user can customize
  // FUTURE VERSION!

  const opts: DashboardOptions = {
    index: `retraced.${req.params.projectId}.${req.query.environment_id}`,
    startTime: moment().subtract(1, "days").valueOf(),
    endTime: moment().valueOf(),
  };

  const actionsTile = await getActionsTile(opts);
  actionsTile.row = 0;
  actionsTile.col = 0;

  const groupsTile = await getGroupsTile(opts);
  groupsTile.row = 0;
  groupsTile.col = 1;

  const result = {
    tiles: [
      actionsTile,
      groupsTile,
    ],
  };

  return {
    status: 200,
    body: JSON.stringify({ result }),
  };
}
