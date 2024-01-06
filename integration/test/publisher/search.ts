import { EventsConnection, Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import { CreateEventSchema } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep } from "../pkg/util";
import * as Env from "../env";
import * as _ from "lodash";
import assert from "assert";

const randomNumber = Math.floor(Math.random() * 99999) + 1;

describe("Publisher Search", function () {
  describe("Given the Retraced API is up and running", function () {
    const retraced = new Client({
      apiKey: Env.ApiKey,
      projectId: Env.ProjectID,
      endpoint: Env.Endpoint,
    });
    const uniqueActorId = randomNumber.toString() + "@retraced.io";

    beforeEach(retracedUp(Env));

    describe(`And 10 events have been reported with actor ${uniqueActorId}`, function () {
      const created = Date.now();
      const events = _.map(_.range(10), (i) => ({
        action: "integration.test.api",
        group: {
          id: "rtrcdqa1234",
          name: "RetracedQA",
        },
        created: new Date(created + i),
        crud: "c" as CRUD,
        source_ip: `192.168.0.${i}`,
        actor: {
          id: uniqueActorId,
          name: "RetracedQA Employee",
          href: "https://retraced.io/employees/qa",
          fields: {
            admin: "true",
          },
        },
        target: {
          id: "rtrcdapi",
          name: "Retraced API",
          href: "https://customertowne.xyz/records/rtrcdapi",
          type: "integration",
          fields: {
            priority: "100",
          },
        },
        description: "Automated integration testing...",
        is_failure: false,
        component: "mocha",
        version: "v1",
        fields: {
          quality: "excellent",
        },
      }));

      before(async () =>
        Promise.all(
          events.map((event) => {
            const valid = tv4.validate(event, CreateEventSchema);
            if (!valid) {
              console.log(tv4.error);
            }
            assert.strictEqual(valid, true);
            return retraced.reportEvent(event);
          })
        )
      );

      context(
        `When searching the publisher GraphQL endpoint for actor_id:${uniqueActorId} with pageSize 3 and fields "action" and "actor.id"`,
        function () {
          let connection: EventsConnection;

          beforeEach(async function () {
            this.timeout(Env.EsIndexWaitMs * 3);
            await sleep(Env.EsIndexWaitMs * 2);

            const structuredQuery = {
              actor_id: uniqueActorId,
            };
            const mask = {
              action: true,
              actor: {
                id: true,
              },
            };
            connection = await retraced.query(structuredQuery, mask, 3);
          });

          specify(
            "Then the connection should contain the first 3 results and metadata about the full results.",
            function () {
              assert.deepEqual(connection.currentResults, [
                {
                  action: "integration.test.api",
                  actor: { id: uniqueActorId },
                },
                {
                  action: "integration.test.api",
                  actor: { id: uniqueActorId },
                },
                {
                  action: "integration.test.api",
                  actor: { id: uniqueActorId },
                },
              ]);
              assert.strictEqual(connection.totalCount, 10);
              assert.strictEqual(connection.hasPreviousPage(), false);
              assert.strictEqual(connection.totalPages(), 4);
              assert.strictEqual(connection.currentPageNumber, 1);
              assert.strictEqual(connection.hasNextPage(), true);
            }
          );

          context("When calling connection.nextPage() three times", function () {
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 3);
              await connection.nextPage();
              await connection.nextPage();
              await connection.nextPage();
            });

            specify(
              "Then the connection should contain the last result and metadata about the full results.",
              function () {
                assert.strictEqual(connection.currentPageNumber, 4);
                assert.strictEqual(connection.totalCount, 10);
                assert.strictEqual(connection.hasNextPage(), false);
                assert.strictEqual(connection.hasPreviousPage(), true);
                assert.strictEqual(connection.totalPages(), 4);
                assert.deepEqual(connection.currentResults, [
                  {
                    action: "integration.test.api",
                    actor: { id: uniqueActorId },
                  },
                ]);
              }
            );
          });
        }
      );
    });
  });
});
