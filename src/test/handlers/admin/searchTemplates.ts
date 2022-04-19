import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import searchTemplates, { deprecated } from "../../../handlers/admin/searchTemplates";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";
import createTemplate from "../../../handlers/admin/createTemplate";
@suite class SearchTemplates {
    @test public async "SearchTemplates#searchTemplates()"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            let res = await setup(pool);
            let result = await searchTemplates(`id=${res.id} token=${res.token}`, "test", "test", 10, 0);
            expect(result.templates.length).to.equal(1);
            expect(result.total_hits).to.equal(1);
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "SearchTemplates#searchTemplates() return 0 elemets"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            let res = await setup(pool, false);
            let result = await searchTemplates(`id=${res.id} token=${res.token}`, "test", "test", 10, 0);
            expect(result.templates.length).to.equal(0);
            expect(result.total_hits).to.equal(0);
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "SearchTemplates#searchTemplates() throws authorization error"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            await searchTemplates(``, "test", "test", 10, 0);
            throw new Error("Expected error \"Missing Authorization header\"");
        } catch (ex) {
            expect(ex.status).to.equal(401);
            expect(ex.err.message).to.equal("Missing Authorization header");
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "SearchTemplates#deprecated()"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            let res = await setup(pool);
            let result = await deprecated({
                get: () => {
                    return `id=${res.id} token=${res.token}`;
                },
                params: {
                    projectId: "test",
                },
                query: {
                    environment_id: "test",
                },
                body: {
                    query: {

                    },
                },
            });
            expect(result.status).to.equal(200);
            expect(JSON.parse(result.body).templates.length).to.equal(1);
            expect(JSON.parse(result.body).total_hits).to.equal(1);
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "SearchTemplates#deprecated() returns 0 elememts"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            let res = await setup(pool, false);
            let result = await deprecated({
                get: () => {
                    return `id=${res.id} token=${res.token}`;
                },
                params: {
                    projectId: "test",
                },
                query: {
                    environment_id: "test",
                },
                body: {
                    query: {

                    },
                },
            });
            expect(result.status).to.equal(200);
            expect(JSON.parse(result.body).templates.length).to.equal(0);
            expect(JSON.parse(result.body).total_hits).to.equal(0);
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "SearchTemplates#deprecated() throws when environment is not received"() {
        let pool = getPgPool();
        try {
            await cleanup(pool);
            let res = await setup(pool);
            await deprecated({
                get: () => {
                    return `id=${res.id} token=${res.token}`;
                },
                params: {
                    projectId: "test",
                },
                query: {

                },
                body: {
                    query: {

                    },
                },
            });
            throw new Error("Expected error \"Missing environment_id\"");
        } catch (ex) {
            expect(ex.status).to.equal(400);
            expect(ex.err.message).to.equal("Missing environment_id");
        } finally {
            await cleanup(pool);
        }
    }
}
async function setup(pool, initiateTemplates = true) {
    await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test1", "test1@test.com"]);
    await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
    await pool.query("INSERT INTO token (token, created, disabled, environment_id, name, project_id, read_access, write_access) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", ["test", new Date(), false, "test", "test", "test", true, true]);
    let res = await AdminTokenStore.default().createAdminToken("test");
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test1", "test", "test1"]);
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
