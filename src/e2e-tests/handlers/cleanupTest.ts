import { suite, test } from "@testdeck/mocha";
import cleanupIngestTask from "../../_processor/workers/cleanupIngestTask";
import cleanupIndexedEvents from "../../_processor/workers/cleanupIndexedEvents";
import getPgPool from "../../persistence/pg";
import { expect } from "chai";
import { AdminTokenStore } from "../../models/admin_token/store";
import create from "../../models/api_token/create";
import config from "../../config";
import { getESWithoutRetry } from "../../persistence/elasticsearch";
import { Client } from "@opensearch-project/opensearch";

const newIndex = `retraced.api.${randomHex()}`;

@suite
class CleanupTest {
  @test public async "CleanupTest#IngestTask()"() {
    const pool = getPgPool();
    try {
      await cleanup(pool);
      await setup(pool);
      const result = await cleanupIngestTask({
        projectId: "test",
        environemntId: "test",
        beforeTimestamp: new Date().toISOString(),
      });
      expect(result).to.equal(20);
      return true;
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
  @test public async "CleanupTest#IndexedEvents()"() {
    const pool = getPgPool();
    const es: Client = getESWithoutRetry();
    try {
      await cleanup(pool, es);
      await setup(pool, es);
      const result = await cleanupIndexedEvents({
        projectId: "test",
        environemntId: "test",
        beforeTimestamp: new Date().toISOString(),
      });

      expect(result).to.equal(1);
      return true;
    } catch (ex) {
      console.log(ex);
    } finally {
      await cleanup(pool);
    }
  }
}
async function setup(pool, es?: Client) {
  await pool.query("INSERT INTO project (id, name) VALUES ($1, $2)", ["test", "test"]);
  await pool.query("INSERT INTO environment (id, name, project_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query("INSERT INTO retraceduser (id, email) VALUES ($1, $2)", ["test", "test@test.com"]);
  await pool.query("INSERT INTO environmentuser (user_id, environment_id, email_token) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "dummytoken",
  ]);
  await pool.query("INSERT INTO projectuser (id, project_id, user_id) VALUES ($1, $2, $3)", [
    "test",
    "test",
    "test",
  ]);
  await pool.query(
    "INSERT INTO group_detail (environment_id, project_id, name, group_id) VALUES ($1, $2, $3, $4)",
    ["test", "test", "test", "test"]
  );
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
  const event = {
    action: "integration18141",
    group: { id: "rtrcdqa1234", name: "RetracedQA" },
    crud: "c",
    received: new Date().toISOString(),
  };
  for (let i = 0; i < 20; i++) {
    const event = {
      action: "integration18141",
      group: { id: "rtrcdqa1234", name: "RetracedQA" },
      crud: "c",
      received: new Date().toISOString(),
    };
    await pool.query(
      "INSERT INTO ingest_task (id, original_event, normalized_event, saved_to_dynamo, saved_to_postgres, saved_to_elasticsearch, saved_to_scylla, project_id, environment_id, new_event_id, received) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ",
      [
        randomHex(),
        JSON.stringify(event),
        JSON.stringify(event),
        "false",
        "false",
        "false",
        "false",
        "test",
        "test",
        randomHex(),
        new Date().toISOString(),
      ]
    );
  }

  await pool.query(
    "INSERT INTO indexed_events (id, project_id, environment_id, doc) VALUES ($1, $2, $3, $4)",
    [randomHex(), "test", "test", JSON.stringify({ ...event, received: +new Date() })]
  );
  if (es) {
    const searchAlias = `retraced.test.test`;
    const writeAlias = `retraced.test.test.current`;
    const aliases = {};
    aliases[searchAlias] = {};
    aliases[writeAlias] = {};
    const params = {
      index: newIndex,
      body: {
        aliases,
      },
    };

    await es.indices.create(params);
    await es.index({
      index: newIndex,
      body: {
        ...event,
        received: +new Date(),
      },
    });
  }
  // Need to sleep for events to be available in ES
  await sleep(800);
  return res;
}

// Sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// create random hex string like hash
function randomHex(len = 32) {
  const maxlen = 32;
  const min = Math.pow(16, Math.min(len, maxlen) - 1);
  const max = Math.pow(16, Math.min(len, maxlen)) - 1;
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  let r = n.toString(16);
  while (r.length < len) {
    r = r + randomHex(len - maxlen);
  }
  return r;
}

async function cleanup(pool, es?: Client) {
  await pool.query(`DELETE FROM admin_token WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environmentuser WHERE user_id=$1`, ["test"]);
  await pool.query(`DELETE FROM environment WHERE name=$1`, ["test"]);
  await pool.query(`DELETE FROM project WHERE name=$1 OR name=$2`, ["test", "test1"]);
  await pool.query(`DELETE FROM projectuser WHERE project_id=$1`, ["test"]);
  await pool.query(`DELETE FROM token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM retraceduser WHERE email=$1`, ["test@test.com"]);
  await pool.query(`DELETE FROM eitapi_token WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM group_detail WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM viewer_descriptors WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM ingest_task WHERE environment_id=$1`, ["test"]);
  await pool.query(`DELETE FROM indexed_events WHERE environment_id=$1`, ["test"]);
  if (es) {
    try {
      const alias = `retraced.test.test.current`;
      await es.deleteByQuery({
        index: alias,
        body: {
          query: {
            bool: {
              must: [{ range: { received: { lt: +new Date() } } }],
            },
          },
        },
      });
      // check if index exists
      const exists = await es.indices.exists({ index: newIndex });
      if (exists.body) {
        await es.indices.delete({ index: newIndex });
      }
    } catch (ex) {
      console.log("Non fatal Error cleaning up ES");
    }
  }
}

export default CleanupTest;
