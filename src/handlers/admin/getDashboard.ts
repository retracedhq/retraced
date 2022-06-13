import moment from "moment";
import _ from "lodash";

import { checkAdminAccess } from "../../security/helpers";

import { DashboardOptions } from "../../dashboard/interfaces";
import getActionsTile from "../../dashboard/actions/top";
import getGroupsTile from "../../dashboard/groups/top";
import config from "../../config";

export default async function(req) {
  await checkAdminAccess(req);

  if (config.PG_SEARCH) {
    return {
      status: 200,
      body: JSON.stringify({
        tiles: [],
      }),
    };
  }

  // This is hard coded for now.  TODO, we should consider making this
  // all stored in the db so that a user can customize
  // FUTURE VERSION!

  const crud = req.query.crud ? req.query.crud : "cud";
  let startTime = moment().subtract(1, "days").valueOf();
  let endTime = moment().valueOf();

  if (req.query.start_time) {
    startTime = parseInt(req.query.start_time, 10);
  }
  if (req.query.end_time) {
    endTime = parseInt(req.query.end_time, 10);
  }

  const opts: DashboardOptions = {
    index: `retraced.${req.params.projectId}.${req.query.environment_id}`,
    startTime,
    endTime,
    crud: _.split(crud, ""),
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
