import { suite, test } from "mocha-typescript";
import counts from "../../../handlers/graphql/counts";
import safeQuery from "../../seederHelper";
import { defaultEventCreater } from "../../../handlers/createEvent";
import { expect } from "chai";
import { AdminTokenStore } from "../../../models/admin_token/store";
import create from "../../../models/api_token/create";

@suite class GraphQLCounts {
    @test public async "GraphQL counts#counts()"() {
        try {
            await setup({
                seedEvents: true,
            });
            const res = await counts("", {
                after: "MA==",
                first: 1,
                crud: "c",
                startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString(),
                endTime: new Date().toISOString(),
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            let op = expect(res).to.not.be.undefined;
            op = expect(res.totalCount).to.not.be.undefined;
            op = expect(res.pageInfo).to.not.be.undefined;
            return op;
        } catch (ex) {
            // console.log(ex);
        }
    }
    @test public async "GraphQL counts#counts() throws invalid cursor"() {
        try {
            await setup({
                seedEvents: true,
            });
            await counts("", {
                after: "0",
                first: 1,
                crud: "c",
                startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString(),
                endTime: new Date().toISOString(),
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            throw new Error("Expected 'Invalid cursor' exception");
        } catch (ex) {
            expect(ex.status).to.equal(400);
            expect(ex.err.message).to.equal("Invalid cursor");
        }
    }
    @test public async "GraphQL counts#counts() without endTime"() {
        try {
            await setup({
                seedEvents: true,
            });
            const res = await counts("", {
                after: "MA==",
                first: 1,
                crud: "c",
                startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString(),
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            let op = expect(res).to.not.be.undefined;
            op = expect(res.totalCount).to.not.be.undefined;
            op = expect(res.pageInfo).to.not.be.undefined;
            return op;
        } catch (ex) {
            // console.log(ex);
        }
    }
    @test public async "GraphQL counts#counts() with invalid endTime"() {
        try {
            await setup({
                seedEvents: true,
            });
            await counts("", {
                after: "MA==",
                first: 1,
                crud: "c",
                endTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString() + "dfsdf",
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            throw new Error("Expected 'Invalid endTime' exception");
        } catch (ex) {
            expect(ex.status).to.equal(400);
            expect(ex.err.message).to.equal("Invalid endTime");
        }
    }
    @test public async "GraphQL counts#counts() without crud"() {
        try {
            await setup({
                seedEvents: true,
            });
            const res = await counts("", {
                after: "MA==",
                first: 1,
                startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString(),
                endTime: new Date().toISOString(),
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            let op = expect(res).to.not.be.undefined;
            op = expect(res.totalCount).to.not.be.undefined;
            op = expect(res.pageInfo).to.not.be.undefined;
            return op;
        } catch (ex) {
            // console.log(ex);
        }
    }
    @test public async "GraphQL counts#counts() without startTime"() {
        try {
            await setup({
                seedEvents: true,
            });
            const res = await counts("", {
                after: "MA==",
                first: 1,
                crud: "c",
                endTime: new Date().toISOString(),
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            let op = expect(res).to.not.be.undefined;
            op = expect(res.totalCount).to.not.be.undefined;
            op = expect(res.pageInfo).to.not.be.undefined;
            return op;
        } catch (ex) {
            // console.log(ex);
        }
    }
    @test public async "GraphQL counts#counts() with invalid startTime"() {
        try {
            await setup({
                seedEvents: true,
            });
            await counts("", {
                after: "MA==",
                first: 1,
                crud: "c",
                startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString() + "dfsdf",
                type: "action",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            throw new Error("Expected 'Invalid startTime' exception");
        } catch (ex) {
            expect(ex.status).to.equal(400);
            expect(ex.err.message).to.equal("Invalid startTime");
        }
    }
    @test public async "GraphQL counts#counts() with type group.id"() {
        try {
            await setup({
                seedEvents: true,
            });
            const res = await counts("", {
                after: "MA==",
                first: 1,
                crud: "c",
                startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 60)).toISOString() + "dfsdf",
                type: "group",
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            let op = expect(res).to.not.be.undefined;
            op = expect(res.totalCount).to.not.be.undefined;
            op = expect(res.pageInfo).to.not.be.undefined;
            return op;
        } catch (ex) {
            // console.log(ex);
        }
    }
}
async function setup(params?) {
    await cleanup();
    await safeQuery("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await safeQuery("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await safeQuery("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await safeQuery("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
    await safeQuery("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await safeQuery("INSERT INTO invite (id, created, email, project_id) VALUES ($1, $2, $3, $4)", ["test", new Date(), "test@test.com", "test"]);
    if (!params.skipSavedSearch) {
        await safeQuery("INSERT INTO saved_search (id, name, project_id, environment_id, group_id, query_desc) VALUES ($1, $2, $3, $4, $5, $6)", [params.invalidSearchId || "test", "test", "test", "test", "test", JSON.stringify(
            {
                version: params.version || 1,
                showCreate: true,
                showRead: false,
                showUpdate: false,
                showDELETE: false,
                // searchQuery?: string,
                // startTime?: number,
                // endTime?: number,
                // actions?: string[],
                // actorIds?: string[],
            },
        )]);
    }
    if (params.seedEvents) {
        try {
            defaultEventCreater.createEvent("token=test", "test", {
                action: "action",
                crud: "c",
                group: {
                    id: "string",
                    name: "group",
                },
                displayTitle: "string",
                created: new Date(),
                actor: {
                    id: "string",
                    name: "actor",
                    href: "string",
                },
                target: {
                    id: "string",
                    name: "target",
                    href: "target",
                    type: "target",
                },
                source_ip: "127.0.0.1",
                description: "desc",
                is_anonymous: true,
                is_failure: true,
                fields: {},
                component: "comp",
                version: "v1",
            });
        } catch (ex) {
            console.log(ex);
        }
    }
    if (!params.skipActiveSearch) {
        await safeQuery("INSERT INTO active_search (id, project_id, environment_id, group_id, saved_search_id ) values ($1, $2, $3, $4, $5)", ["test", "test", "test", "test", params.invalidSearchId || "test"]);
    }
    if (params.DELETESavedSearch) {
        await safeQuery(`DELETE FROM saved_search WHERE project_id=$1`, ["test"]);
    }
    try {
        const res = await AdminTokenStore.default().createAdminToken("test");
        await create("test", "test", {
            name: "test",
            disabled: false,
        }, undefined, "test");
        await safeQuery("INSERT INTO eitapi_token (id, display_name, project_id, environment_id, group_id, view_log_action) VALUES ($1, $2, $3, $4, $5, $6)", ["test", "test", "test", "test", "test", "test"]);
        return res;
    } catch (ex) {
        console.log(ex);
        return {};
    }
}

async function cleanup() {
    await safeQuery(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM environmentuser WHERE user_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM environment WHERE name=$1`, ["test"]);
    await safeQuery(`DELETE FROM project WHERE name=$1 OR name=$2`, ["test", "test1"]);
    await safeQuery(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM retraceduser WHERE email=$1`, ["test@test.com"]);
    await safeQuery(`DELETE FROM eitapi_token WHERE environment_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM invite WHERE project_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM active_search WHERE project_id=$1`, ["test"]);
    await safeQuery(`DELETE FROM saved_search WHERE project_id=$1`, ["test"]);
}

export default GraphQLCounts;
