import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import createAPIToken from "../../../handlers/admin/createApiToken";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";

@suite
class CreateAPIToken {
  @test public async "CreateAPIToken#createAPIToken()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await createAPIToken(
        `id=${res.id} token=${res.token}`,
        "test",
        "test",
        "test",
        {
          disabled: false,
          name: "test",
        }
      );
      expect(result.token).to.equal("test");
      expect(result.projectId).to.equal("test");
      expect(result.environmentId).to.equal("test");
    } catch (ex) {
      console.log(ex);
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
  const res = await AdminTokenStore.default().createAdminToken("test");
  await pool.query(
    "INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)",
    ["test", "test", "test"]
  );
  return res;
}

async function cleanup(pool) {
  await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM projectuser WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
  await pool.query(`DELETE FROM project WHERE name=$1`, ["test"]);
}

export default CreateAPIToken;
