import moment from "moment";

import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function pruneViewerDescriptors() {
  // These expire after 5 minutes, but allow for some clock difference with api
  const before = moment().subtract(1, "day").format();

  await pgPool.query("DELETE FROM viewer_descriptors WHERE created < $1", [before]);
}
