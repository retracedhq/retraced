import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import createInvite from "../../../handlers/admin/createInvite";
import { AdminTokenStore } from "../../../models/admin_token/store";
import { deprecated } from "../../../handlers/admin/createInvite";
import safeQuery from "../../seederHelper";

@suite class CreateInvite {
    @test public async "CreateInvite#createInvite()"() {
        try {
            const res = await setup();
            const result = await createInvite(`id=${res.id} token=${res.token}`, "test", "test@test.com", "test");
            expect(result.id).to.equal("test");
            expect(result.project_id).to.equal("test");
        } catch (ex) {
            console.log(ex);
        }
    }
    @test public async "CreateInvite#deprecated()"() {
        try {
            const res = await setup();
            const result = await deprecated({
                get: () => {
                    return `id=${res.id} token=${res.token}`;
                },
                params: {
                    projectId: "test",
                },
                body: {
                    name: "test",
                },
            });
            expect(result.status).to.equal(201);
            expect(result.body !== undefined);
        } catch (ex) {
            console.log(ex);
        }
    }
}
async function setup() {
    await cleanup();
    await safeQuery("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await safeQuery("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await safeQuery("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await safeQuery("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test1", "test1@test.com"]);
    await safeQuery("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
    // await .query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test1", "test", "dummytoken"]);
    const res = await AdminTokenStore.default().createAdminToken("test");
    await safeQuery("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await safeQuery("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test1", "test", "test1"]);
    // await .query("INSERT INTO deletion_request (id, created, backoff_interval, resource_kind, resource_id) VALUES ($1, $2, $3, $4, $5)", ["test", new Date(), 10000000, "test", "test"]);
    // await .query("INSERT INTO deletion_confirmation (id, deletion_request_id, retraceduser_id, visible_code) VALUES ($1, $2, $3, $4)", ["test", "test", "test", "test"]);
    return res;
}

async function cleanup() {
    await safeQuery(`DELETE FROM environmentuser WHERE environment_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM project WHERE id=$1`, ["test"]);
    await safeQuery(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM environment WHERE name=$1`, ["test"]);
    await safeQuery(`DELETE FROM retraceduser WHERE id=$1 OR id=$2`, ["test", "test1"]);
    await safeQuery(`DELETE FROM deletion_request WHERE resource_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM deletion_confirmation WHERE id=$1`, ["test"]);
    await safeQuery(`DELETE FROM invite WHERE id=$1`, ["test"]);
}

export default CreateInvite;
