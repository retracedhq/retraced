import getPgPool from "../../persistence/pg";
import { randomUUID } from "crypto";

const pgPool = getPgPool();

interface Opts {
  environment_id: string;
  user_id: string;
  daily_report?: boolean;
}

export default async function createEnvironmentUser(opts: Opts) {
  const dailyReport = typeof opts.daily_report === "boolean" ? opts.daily_report : true;
  const emailTkn = randomUUID();

  const q = `
    insert into environmentuser (
      environment_id, user_id, daily_report, email_token
    ) values (
      $1, $2, $3, $4
    )`;
  const v = [opts.environment_id, opts.user_id, dailyReport as any, emailTkn];

  await pgPool.query(q, v);

  return {
    environment_id: opts.environment_id,
    user_id: opts.user_id,
    daily_report: dailyReport,
    email_token: emailTkn,
  };
}
