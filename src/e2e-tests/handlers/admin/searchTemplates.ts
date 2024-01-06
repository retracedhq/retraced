import { suite, test } from "@testdeck/mocha";
import searchTemplates from "../../../handlers/admin/searchTemplates";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";
import createTemplate from "../../../handlers/admin/createTemplate";
import assert from "assert";

@suite
class SearchTemplates {
  @test public async "SearchTemplates#searchTemplates()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await searchTemplates(`id=${res.id} token=${res.token}`, "test", "test", 10, 0);
      assert.strictEqual(result.templates.length, 1);
      assert.strictEqual(result.total_hits, 1);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "SearchTemplates#searchTemplates() return 0 elemets"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool, false);
      const result = await searchTemplates(`id=${res.id} token=${res.token}`, "test", "test", 10, 0);
      assert.strictEqual(result.templates.length, 0);
      assert.strictEqual(result.total_hits, 0);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test
  public async "SearchTemplates#searchTemplates() throws authorization error"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      await searchTemplates(``, "test", "test", 10, 0);
      throw new Error('Expected error "Missing Authorization header"');
    } catch (ex) {
      assert.strictEqual(ex.status, 401);
      assert.strictEqual(ex.err.message, "Missing Authorization header");
    } finally {
      await cleanup(pool);
    }
  }
}
async function setup(pool, initiateTemplates = true) {
  await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
  await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test1", "test1@test.com"]);
  await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "dummytoken",
  ]);
  await pool.query(
    "INSERT INTO token (token, created, disabled, environment_id, name, project_id, read_access, write_access) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    ["test", new Date(), false, "test", "test", "test", true, true]
  );
  const res = await AdminTokenStore.default().createAdminToken("test");
  await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
    "test1",
    "test",
    "test1",
  ]);
  if (initiateTemplates) {
    await createTemplate(`id=${res.id} token=${res.token}`, "test", "test", {
      id: "test",
      name: "test",
      rule: "test",
      template: "test",
    });
  }
  // await pool.query("INSERT INTO deletion_request (id, created, backoff_interval, resource_kind, resource_id) VALUES ($1, $2, $3, $4, $5)", ["test", new Date(), 10000000, "test", "test"]);
  // await pool.query("INSERT INTO deletion_confirmation (id, deletion_request_id, retraceduser_id, visible_code) VALUES ($1, $2, $3, $4)", ["test", "test", "test", "test"]);
  return res;
}

async function cleanup(pool) {
  await pool.query(`DELETE FROM environmentuser WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
  await pool.query(`DELETE FROM project WHERE id=$1`, ["test"]);
  await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
  await pool.query(`DELETE FROM retraceduser WHERE id=$1 OR id=$2`, ["test", "test1"]);
  await pool.query(`DELETE FROM deletion_request WHERE resource_id=$1`, ["test"]);
  await pool.query(`DELETE FROM deletion_confirmation WHERE id=$1`, ["test"]);
  await pool.query(`DELETE FROM invite WHERE project_id=$1`, ["test"]);
  await pool.query(`DELETE FROM display_template WHERE environment_id=$1`, ["test"]);
}

export default SearchTemplates;
