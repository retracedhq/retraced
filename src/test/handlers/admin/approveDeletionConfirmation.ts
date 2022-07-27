import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import approveDeletionConfirmation from "../../../handlers/admin/approveDeletionConfirmation";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";

@suite class ApproveDeletionConfirmation {
    @test public async "ApproveDeletionConfirmation#approveDeletionConfirmation()"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            const result = await approveDeletionConfirmation(`id=${res.id} token=${res.token}`, "test", "test", "test");
            return expect(result).to.be.undefined;
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "ApproveDeletionConfirmation#approveDeletionConfirmation() throws if visible code is invalid"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            await approveDeletionConfirmation(`id=${res.id} token=${res.token}`, "test", "test", "test1");
            throw new Error(`Expected error 'No such confirmation code' to be thrown`);
        } catch (ex) {
            expect(ex.status).to.equal(404);
            expect(ex.err.message).to.equal("No such confirmation code");
        } finally {
            await cleanup(pool);
        }
    }
}
async function setup(pool) {
    await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
    const res = await AdminTokenStore.default().createAdminToken("test");
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO deletion_request (id, created, backoff_interval, resource_kind, resource_id) VALUES ($1, $2, $3, $4, $5)", ["test", new Date(), 10000000, "test", "test"]);
    await pool.query("INSERT INTO deletion_confirmation (id, deletion_request_id, retraceduser_id, visible_code) VALUES ($1, $2, $3, $4)", ["test", "test", "test", "test"]);
    return res;
}

async function cleanup(pool) {
    await pool.query(`DELETE FROM environmentuser WHERE user_id=$1`, ["test"]);
    await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
    await pool.query(`DELETE FROM projectuser WHERE user_id=$1`, ["test"]);
    await pool.query(`DELETE FROM project WHERE id=$1`, ["test"]);
    await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
    await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
    await pool.query(`DELETE FROM retraceduser WHERE id=$1`, ["test"]);
    await pool.query(`DELETE FROM deletion_request WHERE id=$1`, ["test"]);
    await pool.query(`DELETE FROM deletion_confirmation WHERE id=$1`, ["test"]);
}

export default ApproveDeletionConfirmation;
