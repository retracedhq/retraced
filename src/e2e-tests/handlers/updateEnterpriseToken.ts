import { suite, test } from "@testdeck/mocha";
import { updateEnterpriseToken } from "../../handlers/updateEnterpriseToken";
import getPgPool from "../../persistence/pg";
import { createEnterpriseToken } from "../../handlers/createEnterpriseToken";
import { expect } from "chai";
import { AdminTokenStore } from "../../models/admin_token/store";
import create from "../../models/api_token/create";

@suite
class UpdateEnterpriseToken {
  @test public async "UpdateEnterpriseToken#updateEnterpriseToken()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      const result = await createEnterpriseToken(`token=test`, "test", "test", {
        display_name: "test",
      });
      const res = await updateEnterpriseToken(
        "token=test",
        "test",
        "test",
        result.token,
        "test1",
        ""
      );
      expect(res.display_name).to.eq("test1");
      return expect(res).to.not.be.undefined;
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test
  public async "UpdateEnterpriseToken#updateEnterpriseToken() throws if token is wrong"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      const result = await createEnterpriseToken(`token=test`, "test", "test", {
        display_name: "test",
      });
      await updateEnterpriseToken(
        "token=test",
        "test",
        "test1",
        result.token,
        "test",
        ""
      );
      throw new Error(
        `Expected error 'Expected updated row count of 1, got 0' to be thrown`
      );
    } catch (ex) {
      expect(ex.message).to.equal("Expected updated row count of 1, got 0");
    } finally {
      await cleanup(pool);
    }
  }
}
async function setup(pool) {
  await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", [
    "test",
    "test",
  ]);
  await pool.query(
    "INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)",
    ["test", "test", "test"]
  );
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", [
    "test",
    "test@test.com",
  ]);
  await pool.query(
    "INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)",
    ["test", "test", "dummytoken"]
  );
  await pool.query(
    "INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)",
    ["test", "test", "test"]
  );
  await pool.query(
    "INSERT INTO invite (id, created, email, project_id) VALUES ($1, $2, $3, $4)",
    ["test", new Date(), "test@test.com", "test"]
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
  await pool.query(`DELETE FROM project WHERE name=$1 OR name=$2`, [
    "test",
    "test1",
  ]);
  await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
  await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM retraceduser WHERE email=$1`, [
    "test@test.com",
  ]);
  await pool.query(`DELETE FROM eitapi_token WHERE environment_id=$1`, [
    "test",
  ]);
  await pool.query(`DELETE FROM invite WHERE project_id=$1`, ["test"]);
}

export default UpdateEnterpriseToken;
