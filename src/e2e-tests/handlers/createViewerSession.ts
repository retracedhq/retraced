import { suite, test } from "@testdeck/mocha";
import handler from "../../handlers/createViewerSession";
import getPgPool from "../../persistence/pg";
import { AdminTokenStore } from "../../models/admin_token/store";
import create from "../../models/api_token/create";
import assert from "assert";

@suite
class CreateViewerSession {
  @test public async "CreateViewerSession#handlerRaw()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      const result = await handler({
        get: (name) => {
          if (name === "Authorization") {
            return "token=test";
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          token: "test",
        },
        ip: "127.0.0.1",
      });
      assert.strictEqual(result.status, 200);
      return assert(result.body);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test
  public async "CreateViewerSession#handlerRaw() throws if token is wrong"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      await handler({
        get: (name) => {
          if (name === "Authorization") {
            return "token=test";
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          token: "test1",
        },
        ip: "127.0.0.1",
      });
      throw new Error(`Expected error 'Unauthorized' to be thrown`);
    } catch (ex) {
      assert.strictEqual(ex.err.message, "Unauthorized");
      assert.strictEqual(ex.status, 401);
    } finally {
      await cleanup(pool);
    }
  }
}
async function setup(pool) {
  await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
  await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
  await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "dummytoken",
  ]);
  await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query(
    "INSERT INTO group_detail (environment_id, project_id, name, group_id) VALUES ($1, $2, $3, $4)",
    ["test", "test", "test", "test"]
  );
  await pool.query(
    "INSERT INTO viewer_descriptors (id, project_id, environment_id, group_id, actor_id, created, is_admin, view_log_action, scope) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    ["test", "test", "test", "test", "test", new Date(), false, "", "target_id=test"]
  );
  const res = await AdminTokenStore.default().createAdminToken("test");
  await create(
    "test",
    "test",
    {
      name: "test",
      disabled: false,
    },
    undefined,
    "test"
  );
  return res;
}

async function cleanup(pool) {
  await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environmentuser WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
  await pool.query(`DELETE FROM project WHERE name=$1 OR name=$2`, ["test", "test1"]);
  await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
  await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM retraceduser WHERE email=$1`, ["test@test.com"]);
  await pool.query(`DELETE FROM eitapi_token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM group_detail WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM viewer_descriptors WHERE environment_id=$1`, ["test"]);
}

export default CreateViewerSession;
