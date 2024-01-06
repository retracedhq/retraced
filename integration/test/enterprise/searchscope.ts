import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import { CreateEventSchema, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";
import axios from "axios";

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Enterprise Search Group Scoping", function () {
  describe("Given the Retraced API is up and running", function () {
    let resultBody;
    let responseBody;
    let otherToken;
    beforeEach(retracedUp(Env));

    context(
      "And a call is made into the Retraced API with a standard audit event for the RetracedQA group",
      function () {
        beforeEach(async function () {
          const retraced = new Client({
            apiKey: Env.ApiKey,
            projectId: Env.ProjectID,
            endpoint: Env.Endpoint,
          });

          const event = {
            action: "integration.test.api." + randomNumber.toString(),
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

        context("When a call is made to create an eitapi token for a Replicated group", function () {
          beforeEach(async () => {
            if (otherToken) {
              return;
            }
            const resp1 = await axios.post(
              `${Env.Endpoint}/publisher/v1/project/${Env.ProjectID}/group/replqa1234/enterprisetoken`,
              { display_name: "QA" + randomNumber.toString() },
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
            otherToken = responseBody.token;
          });

          context(
            "And the eitapi token is used to call the Enterprise API GraphQL endpoint for event",
            function () {
              beforeEach(async function () {
                this.timeout(Env.EsIndexWaitMs * 2);
                await sleep(Env.EsIndexWaitMs);

                const resp2 = await axios.post(
                  `${Env.Endpoint}/enterprise/v1/graphql`,
                  search("integration.test.api." + randomNumber.toString()),
                  {
                    headers: {
                      Authorization: `token=${otherToken}`,
                    },
                  }
                );
                assert(resp2);
                assert.strictEqual(resp2.status, 200);
                responseBody = resp2.data;
                assert(responseBody);
              });
              specify("Then the response should not include the event from Retraced Group", function () {
                assert.deepStrictEqual(responseBody.data.search.edges, []);
              });
            }
          );
        });
      }
    );
  });
});
