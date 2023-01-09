/*
 * Find all the emails of users that belong to a timezone with a given offset
 * and are subscribed to daily reports for an environment.
 */

import _ from "lodash";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface Options {
  // -12 to 14. Represents the start of a 1 hour interval.
  // Example: +2 would also find offsets of +1:30 and -9 would also find
  // offsets of -9:30.
  offsetHour: number; // -12 to 14
}

export interface Record {
  recipients: {
    email: string;
    id: string;
    token: string;
  }[];
  project_id: string;
  project_name: string;
  environment_id: string;
  environment_name: string;
  // minutes
  utc_offset: number;
}

export default async function dailyReport(opts: Options): Promise<Record[]> {
  const select = `
    select
      array_agg(retraceduser.email) as recipient_emails,
      array_agg(retraceduser.id) as recipient_ids,
      array_agg(environmentuser.email_token) as recipient_tokens,
      project.id as project_id,
      project.name as project_name,
      environmentuser.environment_id as environment_id,
      environment.name as environment_name,
      extract(epoch from pg_timezone_names.utc_offset) / 60 as utc_offset
    from retraceduser
      inner join pg_timezone_names
        on retraceduser.timezone = pg_timezone_names.name
      inner join environmentuser
        on retraceduser.id = environmentuser.user_id
      inner join environment
        on environmentuser.environment_id = environment.id
      inner join project
        on environment.project_id = project.id
    where environmentuser.daily_report = true
      and retraceduser.tx_emails_recipient
      and pg_timezone_names.utc_offset <= make_interval(hours := $1)
      and pg_timezone_names.utc_offset > make_interval(hours := $1) - interval '1 hour'
    group by
      project.id,
      project.name,
      environmentuser.environment_id,
      environment.name,
      pg_timezone_names.utc_offset`;

  const result = await pgPool.query(select, [opts.offsetHour]);

  return result.rows.map((r) => {
    r.recipients = _.zipWith(
      r.recipient_emails,
      r.recipient_ids,
      r.recipient_tokens,
      (email, id, token) => ({ email, id, token })
    );

    return _.omit(r, [
      "recipient_emails",
      "recipient_ids",
      "recipient_tokens",
    ]) as Record;
  });
}
