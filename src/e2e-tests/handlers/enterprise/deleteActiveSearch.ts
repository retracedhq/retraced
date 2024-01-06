import { suite, test } from "@testdeck/mocha";
import deleteActiveSearch from "../../../handlers/enterprise/deleteActiveSearch";
import safeQuery from "../../../test/seederHelper";
import { defaultEventCreater } from "../../../handlers/createEvent";
import { AdminTokenStore } from "../../../models/admin_token/store";
import create from "../../../models/api_token/create";
import assert from "assert";

@suite
class DeleteActiveSearch {
  @test public async "DeleteActiveSearch#deleteActiveSearch()"() {
    try {
      await setup({});
      const res = await deleteActiveSearch({
        get: () => {
          return `token=test`;
        },
        params: {
          activeSearchId: "test",
        },
        body: {},
      });
      assert.strictEqual(res.status, 204);
      return assert.strictEqual(res !== undefined, true);
    } catch (ex) {
      console.log(ex);
    }
  }
  @test
  public async "DeleteActiveSearch#deleteActiveSearch() throws Missing required 'id' parameter"() {
    try {
      await setup({});
      await deleteActiveSearch({
        get: () => {
          return `token=test`;
        },
        params: {
          activeSearchId: "",
        },
        body: {},
      });
      throw new Error(`Expected error "Missing required 'id' parameter" to be thrown`);
    } catch (ex) {
      assert.strictEqual(ex.status, 400);
      assert.strictEqual(ex.err.message, "Missing required 'id' parameter");
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
          showDelete: false,
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
    createTestEvent();
  }
  if (!params.skipActiveSearch) {
    await safeQuery(
      "INSERT INTO active_search (id, project_id, environment_id, group_id, saved_search_id ) values ($1, $2, $3, $4, $5)",
      ["test", "test", "test", "test", params.invalidSearchId || "test"]
    );
  }
  if (params.deleteSavedSearch) {
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
  }
}

function createTestEvent() {
  try {
    defaultEventCreater.createEvent("token=test", "test", {
      action: "action1",
      crud: "c",
      group: {
        id: "string",
        name: "group1",
      },
      created: new Date(),
      actor: {
        id: "string",
        name: "actor1",
        href: "string",
      },
      target: {
        id: "string",
        name: "target1",
        href: "target2",
        type: "target1",
      },
      source_ip: "127.0.0.1",
      description: "descc",
      is_anonymous: true,
      is_failure: true,
      fields: {},
      component: "comp1",
      version: "v1",
    });
  } catch (ex) {
    console.log(ex);
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

export default DeleteActiveSearch;
