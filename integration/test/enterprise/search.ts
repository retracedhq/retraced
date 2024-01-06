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

describe("Enterprise Search", function () {
  describe("Given the Retraced API is up and running", function () {
    let resultBody;
    let responseBody;
    let token;
    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with a standard audit event", function () {
      beforeEach(async function () {
        const retraced = new Client({
          apiKey: Env.ApiKey,
          projectId: Env.ProjectID,
          endpoint: Env.Endpoint,
        });

        const event = {
          action: "integration" + randomNumber.toString(),
          group: {
            id: "rtrcdqa1234",
            name: "RetracedQA",
          },
          created: currentTime,
          crud: "c" as CRUD,
          source_ip: "192.168.0.1",
          actor: {
            id: "qa@retraced.io",
            name: "RetracedQA Employee",
            href: "https://retraced.io/employees/qa",
            fields: {
              department: "QA",
            },
          },
          target: {
            id: "rtrcdapi",
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
        resultBody = await retraced.reportEvent(event);
        assert(resultBody);
      });

      context(
        "When a call is made to create an eitapi token using the Publisher API with a custom view_log_action",
        function () {
          beforeEach(async () => {
            if (token) {
              return;
            }
            const resp1 = await axios.post(
              `${Env.Endpoint}/publisher/v1/project/${Env.ProjectID}/group/rtrcdqa1234/enterprisetoken`,
              {
                display_name: "QA" + randomNumber.toString(),
                view_log_action: "viewlogs.custom",
              },
              {
                headers: {
                  Authorization: `token=${Env.ApiKey}`,
                },
              }
            );
            assert(resp1);
            assert.strictEqual(resp1.status, 201);

            responseBody = resp1.data;
            assert(responseBody.token);
            token = responseBody.token;
          });

          context(
            "And the eitapi token is used to call the Enterprise API GraphQL endpoint for the event",
            function () {
              let responseBody;
              beforeEach(async function () {
                this.timeout(Env.EsIndexWaitMs * 2);
                await sleep(Env.EsIndexWaitMs);
                const resp2 = await axios.post(
                  `${Env.Endpoint}/enterprise/v1/graphql`,
                  search("integration" + randomNumber.toString()),
                  {
                    headers: {
                      Authorization: `token=${token}`,
                    },
                  }
                );
                assert(resp2);
                assert.strictEqual(resp2.status, 200);
                responseBody = resp2.data;
              });
              specify(
                "Then the response should contain the correct information about the event",
                function () {
                  assert.strictEqual(
                    responseBody.data.search.edges[0].node.action,
                    "integration" + randomNumber.toString()
                  );
                  assert.strictEqual(responseBody.data.search.edges[0].node.created, isoDate(currentTime));
                  assert.strictEqual(
                    responseBody.data.search.edges[0].node.description,
                    "Automated integration testing..."
                  );
                  assert.strictEqual(
                    responseBody.data.search.edges[0].node.actor.fields[0].key,
                    "department"
                  );
                  assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].value, "QA");
                  assert.strictEqual(responseBody.data.search.edges[0].node.group.id, "rtrcdqa1234");
                  assert.strictEqual(responseBody.data.search.edges[0].node.target.name, "Retraced API");
                  assert.strictEqual(
                    responseBody.data.search.edges[0].node.target.fields[0].key,
                    "record_count"
                  );
                  assert.strictEqual(responseBody.data.search.edges[0].node.target.fields[0].value, "100");
                  assert.strictEqual(responseBody.data.search.edges[0].node.is_failure, false);
                  assert.strictEqual(responseBody.data.search.edges[0].node.crud, "c");
                  assert.strictEqual(responseBody.data.search.edges[0].node.source_ip, "192.168.0.1");
                  assert.strictEqual(responseBody.data.search.edges[0].node.fields[0].key, "quality");
                  assert.strictEqual(responseBody.data.search.edges[0].node.fields[0].value, "excellent");
                }
              );
            }
          );

          context("When a second call is made to the Enterprise API GraphQL endpoint", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);
              const resp3 = await axios.post(
                `${Env.Endpoint}/enterprise/v1/graphql`,
                search("viewlogs.custom"),
                {
                  headers: {
                    Authorization: `token=${token}`,
                  },
                }
              );
              assert(resp3);
              assert.strictEqual(resp3.status, 200);
              responseBody = resp3.data;
            });
            specify(
              "Then the most recent event should be a viewlogs.custom event with the enterprise token specified as the actor",
              function () {
                assert.strictEqual(responseBody.data.search.edges[0].node.action, "viewlogs.custom");
                assert.strictEqual(responseBody.data.search.edges[0].node.group.id, "rtrcdqa1234");
                assert.strictEqual(responseBody.data.search.edges[0].node.crud, "r");
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.actor.id,
                  "enterprise:" + token.substring(0, 7)
                );
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.actor.name,
                  "QA" + randomNumber.toString()
                );
              }
            );
          });
        }
      );
    });
  });
});
