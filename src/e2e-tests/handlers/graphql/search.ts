import { suite, test } from "@testdeck/mocha";
import search from "../../../handlers/graphql/search";
import safeQuery from "../../../test/seederHelper";
import { defaultEventCreater } from "../../../handlers/createEvent";
import { expect } from "chai";
import { AdminTokenStore } from "../../../models/admin_token/store";
import create from "../../../models/api_token/create";

@suite
class GraphQLCounts {
  @test public async "GraphQL search#search()"() {
    try {
      await setup({
        seedEvents: true,
      });
      const res = await search(
        "",
        {
          query: "",
          after: "MCx0ZXN0",
          first: 1,
        },
        {
          projectId: "test",
          environmentId: "test",
          groupId: "test",
          targetId: "test",
        }
      );
      console.log(res);
      let op = expect(res).to.not.be.undefined;
      op = expect(res.totalCount).to.not.be.undefined;
      op = expect(res.pageInfo).to.not.be.undefined;
      return op;
    } catch (ex) {
      console.log(ex);
    }
  }
  @test public async "GraphQL search#search() with last"() {
    try {
      await setup({
        seedEvents: true,
      });
      const res = await search(
        "",
        {
          query: "",
          after: "MCx0ZXN0",
          last: 1,
        },
        {
          projectId: "test",
          environmentId: "test",
          groupId: "test",
          targetId: "test",
        }
      );
      console.log(res);
      let op = expect(res).to.not.be.undefined;
      op = expect(res.totalCount).to.not.be.undefined;
      op = expect(res.pageInfo).to.not.be.undefined;
      return op;
    } catch (ex) {
      console.log(ex);
    }
  }
  @test public async "GraphQL search#search() with before"() {
    try {
      await setup({
        seedEvents: true,
      });
      const res = await search(
        "",
        {
          query: "",
          before: "MCx0ZXN0",
          last: 1,
        },
        {
          projectId: "test",
          environmentId: "test",
          groupId: "test",
          targetId: "test",
        }
      );
      console.log(res);
      let op = expect(res).to.not.be.undefined;
      op = expect(res.totalCount).to.not.be.undefined;
      op = expect(res.pageInfo).to.not.be.undefined;
      return op;
    } catch (ex) {
      console.log(ex);
    }
  }
  @test
  public async "GraphQL search#search() throws if both before and after is passed"() {
    try {
      await setup({
        seedEvents: true,
      });
      const res = await search(
        "",
        {
          query: "",
          after: "MCx0ZXN0",
          first: 1,
          before: "MCx0ZXN0",
        },
        {
          projectId: "test",
          environmentId: "test",
          groupId: "test",
          targetId: "test",
        }
      );
      console.log(res);
      throw new Error("Expected 'Arguments 'before' and 'after' are exclusive' exception");
    } catch (ex) {
      expect(ex.status).to.equal(400);
      expect(ex.err.message).to.equal("Arguments 'before' and 'after' are exclusive");
    }
  }
  @test
  public async "GraphQL search#search() throws if both first and last passed"() {
    try {
      await setup({
        seedEvents: true,
      });
      const res = await search(
        "",
        {
          query: "",
          after: "MCx0ZXN0",
          first: 1,
          last: 1,
        },
        {
          projectId: "test",
          environmentId: "test",
          groupId: "test",
          targetId: "test",
        }
      );
      console.log(res);
      throw new Error("Expected 'Arguments 'first' and 'last' are exclusive' exception");
    } catch (ex) {
      expect(ex.status).to.equal(400);
      expect(ex.err.message).to.equal("Arguments 'first' and 'last' are exclusive");
    }
  }
  @test public async "GraphQL search#search() throws invalid cursor"() {
    try {
      await setup({
        seedEvents: true,
      });
      const res = await search(
        "",
        {
          query: "",
          after: "0",
          first: 1,
          last: 0,
        },
        {
          projectId: "test",
          environmentId: "test",
          groupId: "test",
          targetId: "test",
        }
      );
      console.log(res);
      throw new Error("Expected 'Invalid cursor' exception");
    } catch (ex) {
      expect(ex.status).to.equal(400);
      expect(ex.err.message).to.equal("Invalid cursor");
    }
  }
}
async function setup(params?) {
  await cleanup();
  await safeQuery("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
  await safeQuery("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await safeQuery("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
  await safeQuery("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "dummytoken",
  ]);
  await safeQuery("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await safeQuery("INSERT INTO invite (id, created, email, project_id) VALUES ($1, $2, $3, $4)", [
    "test",
    new Date(),
    "test@test.com",
    "test",
  ]);
  if (!params.skipSavedSearch) {
    await safeQuery(
      "INSERT INTO saved_search (id, name, project_id, environment_id, group_id, query_desc) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        params.invalidSearchId || "test",
        "test",
        "test",
        "test",
        "test",
        JSON.stringify({
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
        }),
      ]
    );
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
    await safeQuery(
      "INSERT INTO active_search (id, project_id, environment_id, group_id, saved_search_id ) values ($1, $2, $3, $4, $5)",
      ["test", "test", "test", "test", params.invalidSearchId || "test"]
    );
  }
  if (params.DELETESavedSearch) {
    await safeQuery(`DELETE FROM saved_search WHERE project_id=$1`, ["test"]);
  }
  try {
    const res = await AdminTokenStore.default().createAdminToken("test");
    await create(
      "test",
      "test",
      {
        name: "test",
        disabled: false,
      },
      undefined,
      "test"
    );
    await safeQuery(
      "INSERT INTO eitapi_token (id, display_name, project_id, environment_id, group_id, view_log_action) VALUES ($1, $2, $3, $4, $5, $6)",
      ["test", "test", "test", "test", "test", "test"]
    );
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
