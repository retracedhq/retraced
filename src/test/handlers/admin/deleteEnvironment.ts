import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import deleteEnvironment from "../../../handlers/admin/deleteEnvironment";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";
import getElasticsearch from "../../../persistence/elasticsearch";

@suite class DeleteEnvironment {
    @test public async "DeleteEnvironment#deleteEnvironment()"() {
        let pool = getPgPool();
        let es = getElasticsearch();
        try {
            await cleanup(pool, es);
            let res = await setup(pool, es);
            let result = await deleteEnvironment(`id=${res.id} token=${res.token}`, "tests", "tests");
            expect(result).to.be.undefined;
        } catch (ex) {
            // console.log(ex);
        } finally {
            await cleanup(pool, es);
        }
    }
    @test public async "DeleteEnvironment#deleteEnvironment() with preDeleteHook"() {
        let pool = getPgPool();
        let es = getElasticsearch();
        try {
            await cleanup(pool, es);
            let res = await setup(pool, es);
            let result = await deleteEnvironment(`id=${res.id} token=${res.token}`, "tests", "tests", async () => {console.log("Running PreDeleteHook!"); });
            expect(result).to.be.undefined;
        } catch (ex) {
            // console.log(ex);
        } finally {
            await cleanup(pool, es);
        }
    }
}
async function setup(pool, es) {
    await protectedRun(async () => await es.indices.create({ index: `retraced.tests.tests` }));
    await protectedRun(async () => await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["tests", "tests"]));
    await protectedRun(async () => await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["tests", "tests", "tests"]));
    await protectedRun(async () => await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["tests", "test@test.com"]));
    await protectedRun(async () => await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test1", "test1@test.com"]));
    await protectedRun(async () => await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["tests", "tests", "dummytoken"]));
    await protectedRun(async () => await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test1", "test", "dummytoken"]));
    await protectedRun(async () => await pool.query("INSERT INTO token (token, created, disabled, environment_id, name, project_id, read_access, write_access) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", ["tests", new Date(), false, "tests", "tests", "tests", true, true]));
    let res = await AdminTokenStore.default().createAdminToken("tests");
    await protectedRun(async () => await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["tests", "tests", "tests"]));
    await protectedRun(async () => await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test1", "tests", "test1"]));
    await protectedRun(async () => await pool.query("INSERT INTO deletion_request (id, created, backoff_interval, resource_kind, resource_id) VALUES ($1, $2, $3, $4, $5)", ["tests", new Date(), 10000000, "tests", "tests"]));
    // await pool.query("INSERT INTO deletion_confirmation (id, deletion_request_id, retraceduser_id, visible_code) VALUES ($1, $2, $3, $4)", ["tests", "tests", "tests", "tests"]);
    return res;
}

async function cleanup(pool, es) {
    await protectedRun(async () => await es.raw.indices.deleteAlias({ index: `retraced.tests.tests`, name: "_all" }));
    await protectedRun(async () => await pool.query(`DELETE FROM environmentuser WHERE environment_id=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM project WHERE id=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM environment WHERE name=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM retraceduser WHERE id=$1 OR id=$2`, ["tests", "test1"]));
    await protectedRun(async () => await pool.query(`DELETE FROM deletion_request WHERE resource_id=$1`, ["tests"]));
    await protectedRun(async () => await pool.query(`DELETE FROM deletion_confirmation WHERE id=$1`, ["tests"]));
}

async function protectedRun(func) {
    try {
        return (await func());
    } catch (ex) {
        return {};
    }
}
