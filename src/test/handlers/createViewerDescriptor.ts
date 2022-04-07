import { suite, test } from "mocha-typescript";
import handlerRaw from "../../handlers/createViewerDescriptor";
import getPgPool from "../../persistence/pg";
import { expect } from "chai";
import { AdminTokenStore } from "../../models/admin_token/store";
import create from "../../models/api_token/create";

@suite class CreateViewerDescriptor {
    @test public async "CreateViewerDescriptor#handlerRaw()"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            let result = await handlerRaw({
                get: (name) => {
                    if (name === "Authorization") {
                        return "token=test";
                    }
                },
                params: {
                    projectId: "test",
                },
                query: {
                    is_admin: true,
                    group_id: "test",
                    team_id: "test",
                    target_id: "test",
                    view_log_action: "",
                    actor_id: "test",
                },
            });
            expect(result.status).to.equal(201);
            expect(result.body).to.not.be.undefined;
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CreateViewerDescriptor#handlerRaw() throws if group & team ids are not passed"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            await handlerRaw({
                get: (name) => {
                    if (name === "Authorization") {
                        return "token=test";
                    }
                },
                params: {
                    projectId: "test",
                },
                query: {
                    is_admin: true,
                    target_id: "test",
                    view_log_action: "",
                    actor_id: "test",
                },
            });
            throw new Error(`Expected error 'Either group_id or team_id is required' to be thrown`);
        } catch (ex) {
            expect(ex.err.message).to.equal("Either group_id or team_id is required");
            expect(ex.status).to.equal(400);
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
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO group_detail (environment_id, project_id, name, group_id) VALUES ($1, $2, $3, $4)", ["test", "test", "test", "test"]);
    let res = await AdminTokenStore.default().createAdminToken("test");
    await create("test", "test", {
        name: "test",
        disabled: false,
    }, undefined, "test");
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
    await pool.query(`DELETE FROM group_detail WHERE environment_id=$1`, ["test"]);
    await pool.query(`DELETE FROM viewer_descriptors WHERE environment_id=$1`, ["test"]);
}
