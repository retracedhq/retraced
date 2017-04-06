import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface Opts {
  environment_id: string;
  user_id: string;
}

interface Record {
  environment_id: string;
  user_id: string;
  daily_report: boolean;
  anomaly_report: boolean;
  email_token: string;
};

export default async function getEnvironmentUser(opts: Opts): Promise<null | Record> {
  const q = `
    select
      environment_id, user_id, daily_report, anomaly_report, email_token
    from
      environmentuser
    where
      environment_id = $1 and
      user_id = $2`;
  const v = [
    opts.environment_id,
    opts.user_id,
  ];

  const result = await pgPool.query(q, v);
  if (result.rowCount === 1) {
    return result.rows[0];
  } else if (result.rowCount > 1) {
    throw new Error(`Expected row count of 1, got ${result.rowCount}`);
  }
  return null;
};
