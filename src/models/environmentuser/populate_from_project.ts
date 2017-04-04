// Given a project_id and an environment_id, add all project users to that
// environment.
// Given a project_id and a user_id, add that user to all project environments.
import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface ByEnv {
  project_id: string;
  environment_id: string;
};

interface ByUser {
  project_id: string;
  user_id: string;
};

export default async function populateFromProject(opts: ByEnv | ByUser): Promise<void> {
  if ((<ByEnv> opts).environment_id) {
    const q = `
      insert into environmentuser (
        environment_id, user_id, daily_report, email_token
      )
      select $1, user_id, true, md5(random()::text)
      from projectuser
      where project_id = $2`;

    await pgPool.query(q, [(<ByEnv> opts).environment_id, opts.project_id]);
    return;
  }

  const q = `
    insert into environmentuser (
      environment_id, user_id, daily_report, email_token
    )
    select id, $1, true, md5(random()::text)
    from environment
    where project_id = $2`;

  await pgPool.query(q, [(<ByUser> opts).user_id, opts.project_id]);
};
