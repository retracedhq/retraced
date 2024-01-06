import * as querystring from "querystring";
import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import { CreateEventSchema, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";
import axios from "axios";

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Viewer API", function () {
  describe("Given the Retraced API is up and running", function () {
    const groupID = "rtrcdqa" + randomNumber.toString();
    const targetID = "rtrcdapi";
    const actorID = "qa@retraced.io";

    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with a standard audit event", function () {
      beforeEach(async function () {
        const retraced = new Client({
          apiKey: Env.ApiKey,
          projectId: Env.ProjectID,
          endpoint: Env.Endpoint,
        });

        const event = {
          action: "integration.test.api." + randomNumber.toString(),
          group: {
            id: groupID,
            name: "RetracedQA",
          },
          created: currentTime,
          crud: "c" as CRUD,
          source_ip: "192.168.0.1",
          actor: {
            id: actorID,
            name: "RetracedQA Employee",
            href: "https://retraced.io/employees/qa",
            fields: {
              department: "QA",
            },
          },
          target: {
            id: targetID,
            name: "Retraced API",
            href: "https://customertowne.xyz/records/rtrcdapi",
            type: "integration",
            fields: {
              record_count: "100",
            },
          },
          description: "Automated integration testing...",
          is_failure: false,
          fields: {
            quality: "excellent",
          },
        };
        const valid = tv4.validate(event, CreateEventSchema);
        if (!valid) {
          console.log(tv4.error);
        }
        assert.strictEqual(valid, true);
        await retraced.reportEvent(event);
      });

      context("And a call is made to create a viewer description scoped to a target", function () {
        let token;

        beforeEach(async () => {
          const opts = {
            actor_id: actorID,
            group_id: groupID,
            target_id: targetID,
          };
          const qs = querystring.stringify(opts);
          const resp1 = await axios.get(
            `${Env.Endpoint}/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`,
            {
              headers: {
                Authorization: `Token token=${Env.ApiKey}`,
              },
            }
          );
          assert(resp1);
          token = resp1.data.token;
        });

        context("And the viewer descriptor is exchanged for a session", function () {
          let viewerSession;
          beforeEach(async () => {
            const resp2 = await axios.post(`${Env.Endpoint}/viewer/v1/viewersession`, { token });
            assert(resp2);
            assert.strictEqual(resp2.status, 200);
            viewerSession = resp2.data.token;
          });

          context("When a call is made to the Viewer API GraphQL endpoint for the event", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp3 = await axios.post(
                `${Env.Endpoint}/viewer/v1/graphql`,
                search("integration.test.api." + randomNumber.toString()),
                {
                  headers: {
                    Authorization: viewerSession,
                  },
                }
              );
              assert(resp3);
              assert.strictEqual(resp3.status, 200);
              responseBody = resp3.data;
            });
            specify("Then the response should contain the correct information about the event", function () {
              assert.strictEqual(
                responseBody.data.search.edges[0].node.action,
                "integration.test.api." + randomNumber.toString()
              );
            });
          });
        });
      });

      context("And a call is made to create a viewer descriptor", function () {
        let token;
        beforeEach(async () => {
          const retraced = new Client({
            apiKey: Env.ApiKey,
            projectId: Env.ProjectID,
            endpoint: Env.Endpoint,
          });

          token = await retraced.getViewerToken("rtrcdqa" + randomNumber.toString(), "qa@retraced.io", false);
        });

        context("And the viewer descriptor is exchanged for a session", function () {
          let viewerSession;
          beforeEach(async () => {
            const resp4 = await axios.post(`${Env.Endpoint}/viewer/v1/viewersession`, { token });
            assert(resp4);
            assert.strictEqual(resp4.status, 200);
            viewerSession = resp4.data.token;
          });

          context("When a call is made to the Viewer API GraphQL endpoint for the event", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp5 = await axios.post(
                `${Env.Endpoint}/viewer/v1/graphql`,
                search("integration.test.api." + randomNumber.toString()),
                {
                  headers: {
                    Authorization: viewerSession,
                  },
                }
              );
              assert(resp5);
              assert.strictEqual(resp5.status, 200);
              responseBody = resp5.data;
            });

            specify("Then the response should contain the correct information about the event", function () {
              assert.strictEqual(
                responseBody.data.search.edges[0].node.action,
                "integration.test.api." + randomNumber.toString()
              );
              assert.strictEqual(responseBody.data.search.edges[0].node.created, isoDate(currentTime));
              assert.strictEqual(
                responseBody.data.search.edges[0].node.description,
                "Automated integration testing..."
              );
              assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].key, "department");
              assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].value, "QA");
              assert.strictEqual(
                responseBody.data.search.edges[0].node.group.id,
                "rtrcdqa" + randomNumber.toString()
              );
              assert.strictEqual(responseBody.data.search.edges[0].node.target.name, "Retraced API");
              assert.strictEqual(responseBody.data.search.edges[0].node.target.fields[0].key, "record_count");
              assert.strictEqual(responseBody.data.search.edges[0].node.target.fields[0].value, "100");
              assert.strictEqual(responseBody.data.search.edges[0].node.is_failure, false);
              assert.strictEqual(responseBody.data.search.edges[0].node.crud, "c");
              assert.strictEqual(responseBody.data.search.edges[0].node.source_ip, "192.168.0.1");
              assert.strictEqual(responseBody.data.search.edges[0].node.fields[0].key, "quality");
              assert.strictEqual(responseBody.data.search.edges[0].node.fields[0].value, "excellent");
            });
          });
          context("When a second call is made to the Viewer API GraphQL endpoint", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp6 = await axios.post(`${Env.Endpoint}/viewer/v1/graphql`, search("audit.log.view"), {
                headers: {
                  Authorization: viewerSession,
                },
              });
              assert(resp6);
              assert.strictEqual(resp6.status, 200);
              responseBody = resp6.data;
            });
            specify(
              "Then the most recent event should be an audit.log.view event with the actor specified",
              function () {
                assert.strictEqual(responseBody.data.search.edges[0].node.action, "audit.log.view");
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.group.id,
                  "rtrcdqa" + randomNumber.toString()
                );
                assert.strictEqual(responseBody.data.search.edges[0].node.crud, "r");
                assert.strictEqual(responseBody.data.search.edges[0].node.actor.id, "qa@retraced.io");
                assert.strictEqual(responseBody.data.search.edges[0].node.actor.name, "RetracedQA Employee");
                assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].key, "department");
                assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].value, "QA");
              }
            );
          });
        });
      });
    });
  });
});
