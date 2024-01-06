import { suite, test } from "@testdeck/mocha";
import getDashboard from "../../../handlers/admin/getDashboard";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";
import assert from "assert";

@suite
class GetDashboard {
  @test public async "GetDashboard#getDashboard()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await getDashboard({
        get: () => {
          return `id=${res.id} token=${res.token}`;
        },
        query: {
          start_time: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          end_time: new Date(),
          crud: "c",
          environment_id: "test",
        },
        params: {
          projectId: "test",
        },
        body: {
          name: "test",
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
  @test public async "GetDashboard#getDashboard() without crud"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await getDashboard({
        get: () => {
          return `id=${res.id} token=${res.token}`;
        },
        query: {
          start_time: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          end_time: new Date(),
          environment_id: "test",
        },
        params: {
          projectId: "test",
        },
        body: {
          name: "test",
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
  @test public async "GetDashboard#getDashboard() without start_date"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      process.env.PG_SEARCH = "true";
      const result = await getDashboard({
        get: () => {
          return `id=${res.id} token=${res.token}`;
        },
        query: {
          end_time: new Date(),
          crud: "c",
          environment_id: "test",
        },
        params: {
          projectId: "test",
        },
        body: {
          name: "test",
        },
      });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body !== undefined, true);

      process.env.PG_SEARCH = undefined;
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "GetDashboard#getDashboard() without end_date"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      process.env.PG_SEARCH = "true";
      const result = await getDashboard({
        get: () => {
          return `id=${res.id} token=${res.token}`;
        },
        query: {
          start_time: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          crud: "c",
          environment_id: "test",
        },
        params: {
          projectId: "test",
        },
        body: {
          name: "test",
        },
      });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body !== undefined, true);

      process.env.PG_SEARCH = undefined;
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "GetDashboard#getDashboard() with PG_SEARCH"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      process.env.PG_SEARCH = "true";
      const result = await getDashboard({
        get: () => {
          return `id=${res.id} token=${res.token}`;
        },
        query: {
          start_time: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          end_time: new Date(),
          crud: "c",
          environment_id: "test",
        },
        params: {
          projectId: "test",
        },
        body: {
          name: "test",
        },
      });

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body !== undefined, true);

      process.env.PG_SEARCH = undefined;
    } catch (ex) {
      console.log(ex);
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
}

export default GetDashboard;
