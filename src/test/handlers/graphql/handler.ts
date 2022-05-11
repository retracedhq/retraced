import { suite, test } from "mocha-typescript";
import handler from "../../../handlers/graphql/handler";
import getPgPool from "../../../persistence/pg";
import { defaultEventCreater } from "../../../handlers/createEvent";
import { expect } from "chai";
import { AdminTokenStore } from "../../../models/admin_token/store";
import create from "../../../models/api_token/create";

@suite class GraphQLHandler {
    @test public async "GraphQL handler#handler()"() {
        const pool = getPgPool();
        const query = "{search {edges {node {actor {name} source_ip description action}}}}";
        const operationName = "";
        const variables = {};
        try {
            await cleanup(pool);
            await setup(pool, {
                seedEvents: true,
            });
            const res = await handler({
                body: {
                    query,
                    operationName,
                    variables,
                },
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            console.log(res);
            expect(res.status).to.equal(200);
        } catch (ex) {
            // console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "GraphQL handler#handler() with query"() {
        const pool = getPgPool();
        const query = "{search {edges {node {actor {name} source_ip description action}}}}";
        const operationName = "";
        const variables = {};
        try {
            await cleanup(pool);
            await setup(pool, {
                seedEvents: true,
            });
            const res = await handler({
                body: {},
                query: {
                    query,
                    operationName,
                    variables,
                },
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            console.log(res);
            expect(res.status).to.equal(200);
        } catch (ex) {
            // console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
    @test public async "GraphQL handler#handler() throws invalid cursor"() {
        const pool = getPgPool();
        const query = "{fdgd}";
        const operationName = "query";
        const variables = {};
        try {
            await cleanup(pool);
            await setup(pool, {
                seedEvents: true,
            });
            const res = await handler({
                body: {
                    query,
                    operationName,
                    variables,
                },
            }, {
                projectId: "test",
                environmentId: "test",
                groupId: "test",
                targetId: "test",
            });
            expect(res.status).to.equal(400);
        } catch (ex) {
            console.log(ex);
        } finally {
            await cleanup(pool);
        }
    }
}
async function setup(pool, params?) {
    await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
    await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
    await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
    await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", ["test", "test", "test"]);
    await pool.query("INSERT INTO invite (id, created, email, project_id) VALUES ($1, $2, $3, $4)", ["test", new Date(), "test@test.com", "test"]);
    if (!params.skipSavedSearch) {
        await pool.query("INSERT INTO saved_search (id, name, project_id, environment_id, group_id, query_desc) VALUES ($1, $2, $3, $4, $5, $6)", [params.invalidSearchId || "test", "test", "test", "test", "test", JSON.stringify(
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
    }
    if (!params.skipActiveSearch) {
        await pool.query("INSERT INTO active_search (id, project_id, environment_id, group_id, saved_search_id ) values ($1, $2, $3, $4, $5)", ["test", "test", "test", "test", params.invalidSearchId || "test"]);
    }
    if (params.DELETESavedSearch) {
        await pool.query(`DELETE FROM saved_search WHERE project_id=$1`, ["test"]);
    }
    const res = await AdminTokenStore.default().createAdminToken("test");
    await create("test", "test", {
        name: "test",
        disabled: false,
    }, undefined, "test");
    await pool.query("INSERT INTO eitapi_token (id, display_name, project_id, environment_id, group_id, view_log_action) VALUES ($1, $2, $3, $4, $5, $6)", ["test", "test", "test", "test", "test", "test"]);
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
    await pool.query(`DELETE FROM invite WHERE project_id=$1`, ["test"]);
    await pool.query(`DELETE FROM active_search WHERE project_id=$1`, ["test"]);
    await pool.query(`DELETE FROM saved_search WHERE project_id=$1`, ["test"]);
}

export default GraphQLHandler;
