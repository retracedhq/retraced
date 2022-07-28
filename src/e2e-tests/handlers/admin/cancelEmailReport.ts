import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import cancelEmailReport from "../../../handlers/admin/cancelEmailReport";
import getPgPool from "../../../persistence/pg";
import { AdminTokenStore } from "../../../models/admin_token/store";

@suite class CancelEmailReport {
    @test public async "CancelEmailReport#cancelEmailReport()#dailyReport"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            const result = await cancelEmailReport({
                params: {
                    environmentId: "test",
                    userId: "test",
                    report: "daily",
                },
                query: {
                    token: "dummytoken",
                },
            });
            expect(result.status).to.equal(301);
            let res = expect(result.headers !== undefined);
            res = expect(result.headers ? result.headers.Location : undefined !== undefined);
            expect(result.headers ? result.headers.Location : undefined).to.equal("https://www.retraced.io/unsubscribed/daily-reports/");
            return res;
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CancelEmailReport#cancelEmailReport()#anomalyReport"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            const result = await cancelEmailReport({
                params: {
                    environmentId: "test",
                    userId: "test",
                    report: "anomaly",
                },
                query: {
                    token: "dummytoken",
                },
            });
            expect(result.status).to.equal(301);
            let res = expect(result.headers !== undefined);
            res = expect(result.headers ? result.headers.Location : undefined !== undefined);
            expect(result.headers ? result.headers.Location : undefined).to.equal("https://www.retraced.io/unsubscribed/anomaly-reports/");
            return res;
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CancelEmailReport#cancelEmailReport() throws if env user is not found"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            const result = await cancelEmailReport({
                params: {
                    environmentId: "test1",
                    userId: "test",
                    report: "daily",
                },
                query: {
                    token: "dummytoken",
                },
            });
            expect(result.status).to.equal(404);
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "CancelEmailReport#cancelEmailReport() throws if token is invalid"() {
        const pool = getPgPool();
        try {
            await cleanup(pool);
            await setup(pool);
            const result = await cancelEmailReport({
                params: {
                    environmentId: "test",
                    userId: "test",
                    report: "daily",
                },
                query: {
                    token: "dummytoken1",
                },
            });
            expect(result.status).to.equal(401);
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
    await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token, daily_report) VALUES ($1, $2, $3, $4)", ["test", "test", "dummytoken", true]);
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

export default CancelEmailReport;
