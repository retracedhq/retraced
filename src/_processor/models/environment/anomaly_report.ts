import _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface Options {
  // moment
  targetHour: any;
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
}

export default async function anomalyReport(opts: Options): Promise<Record[]> {
  // Filter out environments that don't have subscribers, don't have five weeks
  // of history, or stopped reporting any events more than a week ago.
  const select = `
    with environmenthistory as (
      select distinct
        environment_id
      from action
        where first_active <= $1
        and last_active >= $2
    )
    select
      array_agg(retraceduser.email) as recipient_emails,
      array_agg(retraceduser.id) as recipient_ids,
      array_agg(environmentuser.email_token) as recipient_tokens,
      project.id as project_id,
      project.name as project_name,
      environmentuser.environment_id as environment_id,
      environment.name as environment_name
    from retraceduser
      inner join environmentuser
        on retraceduser.id = environmentuser.user_id
      inner join environment
        on environmentuser.environment_id = environment.id
      inner join project
        on environment.project_id = project.id
      inner join environmenthistory
        on environment.id = environmenthistory.environment_id
    where environmentuser.anomaly_report = true
      and retraceduser.tx_emails_recipient
    group by
      project.id,
      project.name,
      environmentuser.environment_id,
      environment.name`;

  const result = await pgPool.query(select, [
    opts.targetHour.clone().subtract(5, "weeks").format(),
    opts.targetHour.clone().subtract(1, "week").format(),
  ]);

  return result.rows.map((r) => {
    r.recipients = _.zipWith(r.recipient_emails, r.recipient_ids, r.recipient_tokens, (email, id, token) => ({
      email,
      id,
      token,
    }));

    return _.omit(r, ["recipient_emails", "recipient_ids", "recipient_tokens"]) as Record;
  });
}
