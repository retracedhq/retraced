import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import handle from "../../../handlers/admin/createDeletionRequest";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";

@suite class CreateDeletionRequest {
    @test public async "CreateDeletionRequest#createDeletionRequest()"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            const result = await handle(`id=${res.id} token=${res.token}`, "test", "test", {
                resourceKind: "environment",
                resourceId: "test",
            });
            return expect(result.id).to.not.be.undefined;
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CreateDeletionRequest#createDeletionRequest() throws if resource kind is invalid"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            await handle(`id=${res.id} token=${res.token}`, "test", "test", {
                resourceKind: "test",
                resourceId: "test",
            });
            throw new Error(`Expected error 'Unhandled resource kind: 'test'' to be thrown`);
        } catch (ex) {
            expect(ex.status).to.equal(400);
            expect(ex.err.message).to.equal("Unhandled resource kind: 'test'");
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CreateDeletionRequest#createDeletionRequest() throws if resource id is invalid"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            await handle(`id=${res.id} token=${res.token}`, "test", "test", {
                resourceKind: "environment",
                resourceId: "test1",
            });
            throw new Error(`Expected error 'Environment not found: id='test1'' to be thrown`);
        } catch (ex) {
            expect(ex.status).to.equal(400);
            expect(ex.err.message).to.equal("Environment not found: id='test1'");
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CreateDeletionRequest#createDeletionRequest() throws if existing request exists"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            await handle(`id=${res.id} token=${res.token}`, "test", "test", {
                resourceKind: "environment",
                resourceId: "test",
            });
            await handle(`id=${res.id} token=${res.token}`, "test", "test", {
                resourceKind: "environment",
                resourceId: "test",
            });
            throw new Error(`Expected error 'A deletion request already exists for that resource.' to be thrown`);
        } catch (ex) {
            expect(ex.status).to.equal(409);
            expect(ex.err.message).to.equal("A deletion request already exists for that resource.");
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CreateDeletionRequest#createDeletionRequest() existing older request path"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            const res = await setup(pool);
            await pool.query("INSERT INTO deletion_request (id, created, backoff_interval, resource_kind, resource_id) VALUES ($1, $2, $3, $4, $5)", ["test", new Date(new Date().setMonth(new Date().getMonth() - 2)), 10000000, "environment", "test"]);
            const result = await handle(`id=${res.id} token=${res.token}`, "test", "test", {
                resourceKind: "environment",
                resourceId: "test",
            });
            return expect(result.id).to.not.be.undefined;
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
}
async function setup(pool) {
    await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test1", "test1@test.com"]);
    await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
    await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test1", "test", "dummytoken"]);
    const res = await AdminTokenStore.default().createAdminToken("test");
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test1", "test", "test1"]);
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

export default CreateDeletionRequest;
