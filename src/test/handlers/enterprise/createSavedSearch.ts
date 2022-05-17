import { suite, test } from "mocha-typescript";
import createSavedSearch from "../../../handlers/enterprise/createSavedSearch";
import { createEnterpriseToken } from "../../../handlers/createEnterpriseToken";
import { expect } from "chai";
import { AdminTokenStore } from "../../../models/admin_token/store";
import create from "../../../models/api_token/create";
// import CustReq from "../../mock-classes/CustomRequest";
import safeQuery from "../../seederHelper";

// @suite class CreateSavedSearch {
//     @test public async "CreateSavedSearch#createSavedSearch()"() {
//         try {
//             await setup();
//             await createEnterpriseToken(`token=test`, "test", "test", {
//                 display_name: "test",
//             });
//             const req = new CustReq();
//             req.body = {
//                 name: "test",
//                 actions: [],
//                 actor_ids: [],
//                 start: +new Date(),
//             };
//             const res = await createSavedSearch(req);
//             expect(res !== undefined);
//             expect(res.status === 201);
//         } catch (ex) {
//             console.log(ex);
//         }
//     }
//     @test public async "CreateSavedSearch#createSavedSearch() without start time"() {
//         try {
//             await setup();
//             await createEnterpriseToken(`token=test`, "test", "test", {
//                 display_name: "test",
//             });
//             const req = new CustReq();
//             req.body = {
//                 name: "test",
//                 actions: [],
//                 actor_ids: [],
//             };
//             const res = await createSavedSearch(req);
//             console.log(res);
//             expect(res !== undefined);
//             expect(res.status === 201);
//         } catch (ex) {
//             console.log(ex);
//         }
//     }
//     @test public async "CreateSavedSearch#createSavedSearch() with invalid start time"() {
//         try {
//             await setup();
//             await createEnterpriseToken(`token=test`, "test", "test", {
//                 display_name: "test",
//             });
//             const req = new CustReq();
//             req.body = {
//                 name: "test",
//                 actions: [],
//                 actor_ids: [],
//                 start: "randomInvalid value",
//             };
//             const res = await createSavedSearch(req);
//             console.log(res);
//             expect(res !== undefined);
//             expect(res.body !== undefined);
//         } catch (ex) {
//             console.log(ex);
//         }
//     }
//     @test public async "CreateSavedSearch#createSavedSearch() throws Missing required 'name' field"() {
//         try {
//             await setup();
//             await createEnterpriseToken(`token=test`, "test", "test", {
//                 display_name: "test",
//             });
//             const req = new CustReq();
//             req.body = {
//                 actions: [],
//                 actor_ids: [],
//                 start: "",
//             };
//             const result = await createSavedSearch(req);
//             console.log(result);
//             throw new Error(`Expected error "Missing required 'name' field" to be thrown`);
//         } catch (ex) {
//             console.log(ex);
//             expect(ex.status).to.equal(400);
//             expect(ex.err.message).to.equal("Missing required 'name' field");
//         }
//     }
//     // @test public async "CreateSavedSearch#createSavedSearch() throws search id is invalid"() {
//     //
//     //     const savedSearchId = "testt";
//     //     try {
//     //         await cleanup();
//     //         await setup();
//     //         await createEnterpriseToken(`token=test`, "test", "test", {
//     //             display_name: "test",
//     //         });
//     //         const res = await createSavedSearch({
//     //             get: () => {
//     //                 return `token=test`;
//     //             },
//     //             body: {
//     //                 saved_search_id: savedSearchId,
//     //             },
//     //         });
//     //         throw new Error(`Expected error "Saved search not found (id=${savedSearchId})' to be thrown`);
//     //     } catch (ex) {
//     //         expect(ex.status).to.equal(404);
//     //         expect(ex.err.message).to.equal(`Saved search not found (id=${savedSearchId})`);
//     //     } finally {
//     //         await cleanup();
//     //     }
//     // }
// }
async function setup() {
    try {
        await cleanup();
        await safeQuery("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
        await safeQuery("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
        await safeQuery("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
        await safeQuery("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
        await safeQuery("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
        await safeQuery("INSERT INTO invite (id, created, email, project_id) VALUES ($1, $2, $3, $4)", ["test", new Date(), "test@test.com", "test"]);
        await safeQuery("INSERT INTO saved_search (id, name, project_id, environment_id, group_id, query_desc) VALUES ($1, $2, $3, $4, $5, $6)", ["test", "test", "test", "test", "test", "Select all actors from Pune"]);
        const res = await AdminTokenStore.default().createAdminToken("test");
        await create("test", "test", {
            name: "test",
            disabled: false,
        }, undefined, "test");
        return res;
    } catch (ex) {
        console.log("Setup", ex);
    }
}

async function cleanup() {
    try {
        await safeQuery(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM environmentuser WHERE user_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM environment WHERE name=$1`, ["test"]);
        await safeQuery(`DELETE FROM project WHERE name=$1`, ["test"]);
        await safeQuery(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM retraceduser WHERE email=$1`, ["test@test.com"]);
        await safeQuery(`DELETE FROM eitapi_token WHERE environment_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM invite WHERE project_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM active_search WHERE project_id=$1`, ["test"]);
        await safeQuery(`DELETE FROM saved_search WHERE project_id=$1 OR id=$1`, ["test"]);
    } catch (ex) {
        console.log("Cleanup", ex);
    }
}

// export default CreateSavedSearch;
