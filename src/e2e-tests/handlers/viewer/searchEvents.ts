import { suite, test } from "@testdeck/mocha";
import searchEvents from "../../../handlers/viewer/searchEvents";
import getPgPool from "../../../persistence/pg";
import { defaultEventCreater } from "../../../handlers/createEvent";
import { AdminTokenStore } from "../../../models/admin_token/store";
import createSession from "../../../handlers/createViewerSession";
import assert from "assert";

@suite
class SearchEvents {
  @test public async "searchEvents#searchEvents()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const token = await setup(pool, {
        seedEvents: true,
        targetIdType: "String",
      });
      const res = await searchEvents({
        get: (name) => {
          switch (name) {
            case "Authorization":
              return `${token}`;
            case "ETag":
              return `test`;
            default:
              return `${token}`;
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          query: {
            search_text: "127.0.0.1",
            offset: 0,
            length: 50,
            start_time: 0,
            end_time: +new Date(),
            create: true,
            read: false,
            update: false,
            delete: false,
          },
        },
      });
      assert.strictEqual(res.status, 200);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "searchEvents#searchEvents() with scope with array"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const token = await setup(pool, {
        seedEvents: true,
        targetIdType: "Array",
      });
      const res = await searchEvents({
        get: (name) => {
          switch (name) {
            case "Authorization":
              return `${token}`;
            case "ETag":
              return `test`;
            default:
              return `${token}`;
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          query: {
            search_text: "127.0.0.1",
            offset: 0,
            length: 50,
            start_time: 0,
            end_time: +new Date(),
            create: true,
            read: false,
            update: false,
            delete: false,
          },
        },
      });
      assert.strictEqual(res.status, 200);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test
  public async "searchEvents#searchEvents() with scope with empty array"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const token = await setup(pool, {
        seedEvents: true,
        targetIdType: "Array",
        targetIdEmptyArray: true,
      });
      const res = await searchEvents({
        get: (name) => {
          switch (name) {
            case "Authorization":
              return `${token}`;
            case "ETag":
              return `test`;
            default:
              return `${token}`;
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          query: {
            search_text: "127.0.0.1",
            offset: 0,
            length: 50,
            start_time: 0,
            end_time: +new Date(),
            create: true,
            read: false,
            update: false,
            delete: false,
          },
        },
      });
      assert.strictEqual(res.status, 200);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "searchEvents#searchEvents() with null scope"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const token = await setup(pool, {
        seedEvents: true,
        targetIdType: "",
      });
      const res = await searchEvents({
        get: (name) => {
          switch (name) {
            case "Authorization":
              return `${token}`;
            case "ETag":
              return `test`;
            default:
              return `${token}`;
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          query: {
            search_text: "127.0.0.1",
            offset: 0,
            length: 50,
            start_time: 0,
            end_time: +new Date(),
            create: true,
            read: false,
            update: false,
            delete: false,
          },
        },
      });
      assert.strictEqual(res.status, 200);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "searchEvents#searchEvents() with default query"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      const token = await setup(pool, {
        seedEvents: true,
        targetIdType: "",
      });
      const res = await searchEvents({
        get: (name) => {
          switch (name) {
            case "Authorization":
              return `${token}`;
            case "ETag":
              return `test`;
            default:
              return `${token}`;
          }
        },
        params: {
          projectId: "test",
        },
        body: {
          query: {
            search_text: "",
            length: 25,
            create: true,
            read: false,
            update: true,
            delete: true,
          },
        },
      });
      assert.strictEqual(res.status, 200);
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
}
async function setup(pool, params?) {
  await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
  await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  // await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
  // await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", ["test", "test", "dummytoken"]);
  await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query("INSERT INTO invite (id, created, email, project_id) VALUES ($1, $2, $3, $4)", [
    "test",
    new Date(),
    "test@test.com",
    "test",
  ]);
  if (!params.skipSavedSearch) {
    await pool.query(
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
          // searchEventsQuery?: string,
          // startTime?: number,
          // endTime?: number,
          // actions?: string[],
          // actorIds?: string[],
        }),
      ]
    );
  }
  if (params.seedEvents) {
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
  }
  if (!params.skipActiveSearch) {
    await pool.query(
      "INSERT INTO active_search (id, project_id, environment_id, group_id, saved_search_id ) values ($1, $2, $3, $4, $5)",
      ["test", "test", "test", "test", params.invalidSearchId || "test"]
    );
  }
  if (params.deleteSavedSearch) {
    await pool.query(`DELETE FROM saved_search WHERE project_id=$1`, ["test"]);
  }
  await AdminTokenStore.default().createAdminToken("test");
  const scope =
    params.targetIdType === "Array"
      ? params.targetIdEmptyArray
        ? "target_id=[]"
        : "target_id=['test', 'name']"
      : params.targetIdType === "String"
        ? "target_id=test"
        : "";
  await pool.query(
    "INSERT INTO viewer_descriptors (id, project_id, environment_id, group_id, actor_id, created, is_admin, view_log_action, scope) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    ["test", "test", "test", "test", "test", new Date(), false, "", scope]
  );
  const res = await createSession({
    get: (name) => {
      if (name === "Authorization") {
        return "token=test";
      }
    },
    params: {
      projectId: "test",
    },
    body: {
      token: "test",
    },
    ip: "127.0.0.1",
  });
  const token = JSON.parse(res.body).token;
  await pool.query(
    "INSERT INTO eitapi_token (id, display_name, project_id, environment_id, group_id, view_log_action) VALUES ($1, $2, $3, $4, $5, $6)",
    ["test", "test", "test", "test", "test", "test"]
  );
  return token;
}

async function cleanup(pool) {
  await pool.query(`DELETE FROM viewer_descriptors WHERE environment_id=$1`, ["test"]);
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

export default SearchEvents;
