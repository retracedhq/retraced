import { suite, test } from "@testdeck/mocha";
import { deleteEnterpriseToken } from "../../handlers/deleteEnterpriseToken";
import getPgPool from "../../persistence/pg";
import { createEnterpriseToken } from "../../handlers/createEnterpriseToken";
import { AdminTokenStore } from "../../models/admin_token/store";
import create from "../../models/api_token/create";
import assert from "assert";

@suite
class DeleteEnterpriseToken {
  @test public async "deleteEnterpriseToken#deleteEnterpriseToken()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      const result = await createEnterpriseToken(`token=test`, "test", "test", {
        display_name: "test",
      });
      await deleteEnterpriseToken("token=test", "test", "test", result.token);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test
  public async "deleteEnterpriseToken#deleteEnterpriseToken() throws if token is wrong"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      const result = await createEnterpriseToken(`token=test`, "test", "test", {
        display_name: "test",
      });
      await deleteEnterpriseToken("token=test", "test", "test", result.token + "1");
      throw new Error(`Expected error 'Not Found' to be thrown`);
    } catch (ex) {
      assert.strictEqual(ex.status, 404);
      assert.strictEqual(ex.err.message, "Not Found");
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
}

export default DeleteEnterpriseToken;
