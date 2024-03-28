import { suite, test } from "@testdeck/mocha";
import searchEvents from "../../../handlers/admin/searchEvents";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";
import assert from "assert";

@suite
class SearchEvents {
  @test public async "SearchEvents#searchEvents()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      await pool.query(
        "INSERT INTO token (token, created, disabled, environment_id, name, project_id, read_access, write_access) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["test", new Date() as any, false, "test", "test", "test", true, true]
      );
      const result = await searchEvents({
        headers: {
          authorization: `token=test`,
        },
        params: {
          projectId: "test",
        },
        query: {
          environment_id: "test",
        },
        body: {
          query: {
            search_text: "127.0.0.1",
            offset: 0,
            length: 50,
            start_time: 0,
            end_time: +new Date(),
            create: "c",
            read: "",
            update: "",
            delete: "",
          },
        },
      });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body !== undefined, true);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "SearchEvents#searchEvents() without read access"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      await pool.query(
        "INSERT INTO token (token, created, disabled, environment_id, name, project_id, read_access, write_access) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["test", new Date() as any, false, "test", "test", "test", false, true]
      );
      await searchEvents({
        headers: {
          authorization: `token=test`,
        },
        params: {
          projectId: "test",
        },
        query: {
          environment_id: "test",
        },
      });
      throw new Error(`Expected an error 'Unauthorized'`);
    } catch (ex) {
      assert.strictEqual(ex.status, 401);
      assert.strictEqual(ex.err.message, "Unauthorized");
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "SearchEvents#searchEvents() without environment id"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      await pool.query(
        "INSERT INTO token (token, created, disabled, environment_id, name, project_id, read_access, write_access) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["test", new Date() as any, false, "test", "test", "test", true, true]
      );
      await searchEvents({
        headers: {
          authorization: `token=test`,
        },
        params: {
          projectId: "test",
        },
        query: {},
      });
      throw new Error(`Expected an error 'Missing environment_id'`);
    } catch (ex) {
      assert.strictEqual(ex.status, 400);
      assert.strictEqual(ex.err.message, "Missing environment_id");
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
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test1", "test1@test.com"]);
  await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "dummytoken",
  ]);
  // await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test1", "test", "dummytoken"]);
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
  await pool.query(
    "INSERT INTO actor (id, created, environment_id, event_count, first_active, foreign_id, last_active, name, project_id, url, fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    [
      "test",
      new Date(),
      "test",
      100,
      new Date(),
      "test",
      new Date(),
      "test",
      "test",
      "www.test.com",
      { name: "test" },
    ]
  );
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
  await pool.query(`DELETE FROM action WHERE id=$1`, ["test"]);
  await pool.query(`DELETE FROM actor WHERE id=$1 OR environment_id=$1`, ["test"]);
}

export default SearchEvents;
