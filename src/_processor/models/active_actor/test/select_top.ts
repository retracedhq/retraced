import { expect } from "chai";
import moment from "moment";

import getPgPool from "../../../persistence/pg";
import selectTop from "../select_top";

const pgPool = getPgPool();

describe("models.active_actor.select_top", () => {
  describe(`
    First actor has 5 actions but none during search period.
    Another actor has 1 action during search period.
    Five more actors have 2 actions during search period.`, () => {
    const projectId = crypto.randomUUID();
    const environmentId = crypto.randomUUID();
    const actors = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];
    const ref = moment.utc("2017-03-29");
    const actions = [
      // actor with 0 actions during search period but 5 before and after
      [actors[0], ref.clone().subtract(1, "hour")],
      [actors[0], ref.clone().subtract(1, "minute")],
      [actors[0], ref.clone().subtract(1, "second")],
      [actors[0], ref.clone().add(1, "day")],
      [actors[0], ref.clone().add(1, "day")],
      // actors with 2 actions during search period
      [actors[1], ref],
      [actors[1], ref.clone().add(1, "second")],
      [actors[2], ref.clone().add(5, "minutes")],
      [actors[2], ref.clone().add(5, "minutes")],
      [actors[3], ref.clone().add(2, "hours")],
      [actors[3], ref.clone().add(2, "hours")],
      [actors[4], ref.clone().add(12, "hours")],
      [actors[4], ref.clone().add(12, "hours")],
      [actors[5], ref.clone().add(45, "minutes")],
      [actors[5], ref.clone().add(45, "minutes")],
      [actors[5], ref.clone().add(2, "days")],
      // actor with 1 action during search period
      [actors[6], ref],
    ];

    actions.forEach(([actorID, created]) => {
      before(() =>
        pgPool.query(
          `
        insert into active_actor (
          actor_id, project_id, environment_id, created_at
        ) values (
          $1, $2, $3, $4
        )`,
          [actorID, projectId, environmentId, created]
        )
      );
    });
    after(() => pgPool.query("delete from active_actor where project_id = $1", [projectId]));

    describe("search 2017-03-29 00:00:00 to 2017-03-30 00:00:00", () => {
      it("should return the counts for the five actors active during the search period", () => {
        return selectTop({
          projectId,
          environmentId,
          range: [ref, ref.clone().add(1, "day")],
        }).then((results) => {
          expect(results).to.have.length(5);

          const actor0 = results.find(({ actor_id }) => actor_id === actors[0]);
          const actor1 = results.find(({ actor_id }) => actor_id === actors[1]);
          const actor2 = results.find(({ actor_id }) => actor_id === actors[2]);
          const actor3 = results.find(({ actor_id }) => actor_id === actors[3]);
          const actor4 = results.find(({ actor_id }) => actor_id === actors[4]);
          const actor5 = results.find(({ actor_id }) => actor_id === actors[5]);
          const actor6 = results.find(({ actor_id }) => actor_id === actors[6]);

          expect(actor0).to.equal(undefined);
          expect(actor6).to.equal(undefined);
          expect(actor1).to.have.property("action_count", 2);
          expect(actor2).to.have.property("action_count", 2);
          expect(actor3).to.have.property("action_count", 2);
          expect(actor4).to.have.property("action_count", 2);
          expect(actor5).to.have.property("action_count", 2);
        });
      });
    });
  });
});
