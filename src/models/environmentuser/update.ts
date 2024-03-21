import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface Opts {
  environment_id: string;
  user_id: string;
  daily_report: boolean;
  anomaly_report: boolean;
}

export default async function createEnvironmentUser(opts: Opts): Promise<void> {
  const q = `
    update environmentuser
    set daily_report = $3, anomaly_report = $4
    where environment_id = $1 and user_id = $2`;
  const v = [opts.environment_id, opts.user_id, opts.daily_report, opts.anomaly_report as any];

  await pgPool.query(q, v);
}
