import { expect } from "chai";
import * as uuid from "uuid";
import moment from "moment";

import getPgPool from "../../../persistence/pg";
import selectNew from "../select_new";

const pgPool = getPgPool();

describe("models.action.select_new", () => {
  describe(`
    "a.create" was first seen on 2017-03-28 at 11PM.
    "a.update" was first seen on 2017-03-29 at 12AM.
    "a.get" was first seen on 2017-03-29 at 1AM.
    "a.list" was first seen on 2017-03-30 at 12AM.`, () => {
    const projectId = uuid.v4();
    const environmentId = uuid.v4();
    const ref = moment.utc("2017-03-29");
    const actions = [
      ["a.create", ref.clone().subtract(1, "hour")],
      ["a.update", ref],
      ["a.get", ref.clone().add(1, "hour")],
      ["a.list", ref.clone().add(1, "day")],
    ];

    actions.forEach(([action, firstActive]) => {
      before(() =>
        pgPool.query(
          `
        insert into action (id, project_id, environment_id, action, first_active)
        values ($1, $2, $3, $4, $5)`,
          [uuid.v4(), projectId, environmentId, action, firstActive]
        )
      );
    });
    after(() =>
      pgPool.query("delete from action where project_id = $1", [projectId])
    );

    describe("searching 2017-03-29 00:00:00 to 2017-03-30 00:00:00", () => {
      it('should return "a.update" and "a.get".', () => {
        return selectNew({
          projectId,
          environmentId,
          range: [ref, ref.clone().add(1, "day")],
        }).then((acts) => {
          expect(acts).to.have.length(2);
          expect(acts).to.include("a.update");
          expect(acts).to.include("a.get");
        });
      });
    });
  });
});
