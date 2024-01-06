import { suite, test } from "@testdeck/mocha";
import createProject from "../../../handlers/admin/createProject";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";
import assert from "assert";

@suite
class CreateProject {
  @test public async "CreateProject#createProject()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await createProject({
        get: (name) => {
          if (name === "Authorization") {
            return `id=${res.id} token=${res.token}`;
          }
        },
        params: {
          projectId: "test",
          environment_id: "test",
        },
        body: {
          name: "test1",
        },
      });
      assert.strictEqual(result.status, 201);
      assert.strictEqual(JSON.parse(result.body).project.name, "test1");
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
}
async function setup(pool) {
  try {
    await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", [
      "test",
      "test",
      "test",
    ]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await pool.query(
      "INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)",
      ["test", "test", "dummytoken"]
    );
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
      "test",
      "test",
      "test",
    ]);
    const res = await AdminTokenStore.default().createAdminToken("test");
    return res;
  } catch (ex) {
    console.log(ex);
    return { id: "", token: "" };
  }
}

async function cleanup(pool) {
  try {
    await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
    await pool.query(`DELETE FROM environmentuser WHERE user_id=$1`, ["test"]);
    await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
    await pool.query(`DELETE FROM project WHERE name=$1 OR name=$2`, ["test", "test1"]);
    await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
    await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
    await pool.query(`DELETE FROM retraceduser WHERE email=$1`, ["test@test.com"]);
  } catch (ex) {
    console.log(ex);
  }
}

export default CreateProject;
