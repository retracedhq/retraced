import "source-map-support/register";
import * as uuid from "uuid";

import getPgPool from "../../../persistence/pg";

const pgPool = getPgPool();

export function fixProject(project) {
  before(() => pgPool.query(`
    insert into project (id, name) values ($1, $2)`,
    [project.id, project.name],
  ));
  after(() => pgPool.query(`delete from project where id = $1`, [project.id]));

  before(() => pgPool.query(`
    insert into environment (
      id, name, project_id
    ) values
    (  $1, $2, $3 ),
    ( $4, $5, $6 )`,
    [project.prodEnvID, "Prod", project.id, project.stageEnvID, "Stage", project.id],
  ));
  after(() => pgPool.query(`delete from environment where project_id = $1`, [project.id]));

  project.users.forEach((user) => {
    before(() => pgPool.query(`
      insert into retraceduser (
        id, email, timezone
      ) values (
        $1, $2, $3
      )`,
      [user.id, user.email, user.timezone || "US/Pacific"]),
    );
    after(() => pgPool.query(`delete from retraceduser where id = $1`, [user.id]));

    before(() => pgPool.query(`
      insert into projectuser (
        id, project_id, user_id
      ) values (
        $1, $2, $3
      )`,
      [uuid.v4(), project.id, user.id]),
    );

    before(() => pgPool.query(`
      insert into environmentuser (
        user_id, environment_id, daily_report, anomaly_report, email_token
      ) values
      ( $1, $2, $3, $3, 'xyz' ),
      ( $4, $5, $6, $6, 'xyz' )
      `,
      [user.id, project.prodEnvID, user.prod, user.id, project.stageEnvID, user.stage]),
    );
  });
  after(() => pgPool.query(`delete from projectuser where project_id = $1`, [project.id]));
  after(() => pgPool.query(`delete from environmentuser where environment_id in ($1, $2)`, [project.prodEnvID, project.stageEnvID]));
}
