import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import getDeletionRequest from "../../../handlers/admin/getDeletionRequest";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";

@suite
class GetDeletionRequest {
  @test public async "GetDeletionRequest#getDeletionRequest()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await getDeletionRequest(
        `id=${res.id} token=${res.token}`,
        "test",
        "test",
        "test"
      );
      expect(result.expired).to.equal(false);
      expect(result.backoffRemaining).to.equal(9999999);
      expect(result.outstandingConfirmations.length).to.equal(0);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "GetDeletionRequest#getDeletionRequest() throws 404"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const res = await setup(pool);
      const result = await getDeletionRequest(
        `id=${res.id} token=${res.token}`,
        "test",
        "test",
        "test1"
      );
      console.log(result);
      throw new Error("Exprected to throw '{ status: 404 }'");
    } catch (ex) {
      expect(ex.status).to.equal(404);
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
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", [
    "test1",
    "test1@test.com",
  ]);
  await pool.query(
    "INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)",
    ["test", "test", "dummytoken"]
  );
  // await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test1", "test", "dummytoken"]);
  const res = await AdminTokenStore.default().createAdminToken("test");
  await pool.query(
    "INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)",
    ["test", "test", "test"]
  );
  await pool.query(
    "INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)",
    ["test1", "test", "test1"]
  );
  await pool.query(
    "INSERT INTO deletion_request (id, created, backoff_interval, resource_kind, resource_id) VALUES ($1, $2, $3, $4, $5)",
    ["test", new Date(), 10000000, "test", "test"]
  );
  // await pool.query("INSERT INTO deletion_confirmation (id, deletion_request_id, retraceduser_id, visible_code) VALUES ($1, $2, $3, $4)", ["test", "test", "test", "test"]);
  return res;
}

async function cleanup(pool) {
  await pool.query(`DELETE FROM environmentuser WHERE environment_id=$1`, [
    "test",
  ]);
  await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
  await pool.query(`DELETE FROM project WHERE id=$1`, ["test"]);
  await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
  await pool.query(`DELETE FROM retraceduser WHERE id=$1 OR id=$2`, [
    "test",
    "test1",
  ]);
  await pool.query(`DELETE FROM deletion_request WHERE resource_id=$1`, [
    "test",
  ]);
  await pool.query(`DELETE FROM deletion_confirmation WHERE id=$1`, ["test"]);
}

export default GetDeletionRequest;
