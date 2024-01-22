import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import { CreateEventSchema, GraphQLQuery, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";
import axios from "axios";

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Create Events", function () {
  describe("Given the Retraced API is up and running", function () {
    let responseBody: any = {};
    let resultBody;
    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with a standard audit event", () => {
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

      context("When a call is made to the GraphQL endpoint for the event", function () {
        beforeEach(async function () {
          this.timeout(Env.EsIndexWaitMs * 2);
          await sleep(Env.EsIndexWaitMs);

          const resp1 = await axios.post(
            `${Env.Endpoint}/publisher/v1/graphql`,
            search("integration" + randomNumber.toString()),
            {
              headers: {
                Authorization: "token=" + Env.ApiKey,
              },
            }
          );
          assert(resp1);
          assert.strictEqual(resp1.status, 200);
          responseBody = resp1.data;
        });
        specify("Then the response should contain the correct information about the event", function () {
          assert.strictEqual(
            responseBody.data.search.edges[0].node.action,
            "integration" + randomNumber.toString()
          );
          assert.strictEqual(responseBody.data.search.edges[0].node.created, isoDate(currentTime));
          assert.strictEqual(
            responseBody.data.search.edges[0].node.description,
            "Automated integration testing..."
          );
          assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].key, "department");
          assert.strictEqual(responseBody.data.search.edges[0].node.actor.fields[0].value, "QA");
          assert.strictEqual(responseBody.data.search.edges[0].node.group.id, "rtrcdqa1234");
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
    });
  });

  describe("Given the Retraced API is up and running", function () {
    let responseBody: any = {};
    let resultBody;
    beforeEach(retracedUp(Env));

    context(
      "And a call is made into the Retraced API with a standard audit event that has the minimum amount of information",
      function () {
        beforeEach(async function () {
          const retraced = new Client({
            apiKey: Env.ApiKey,
            projectId: Env.ProjectID,
            endpoint: Env.Endpoint,
          });

          const event = {
            action: "integrationminimum" + randomNumber.toString(),
            crud: "c" as CRUD,
            is_anonymous: true,
          };
          const valid = tv4.validate(event, CreateEventSchema);
          if (!valid) {
            console.log(tv4.error);
          }
          assert.strictEqual(valid, true);
          resultBody = await retraced.reportEvent(event);
          assert(resultBody);
        });

        context("When a call is made to the GraphQL endpoint for the event", function () {
          const thisQuery = GraphQLQuery;
          thisQuery.variables.query = "integrationminimum" + randomNumber.toString();
          beforeEach(async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);

            const resp2 = await axios.post(`${Env.Endpoint}/publisher/v1/graphql`, thisQuery, {
              headers: {
                Authorization: "token=" + Env.ApiKey,
              },
            });
            assert(resp2);
            assert.strictEqual(resp2.status, 200);
            responseBody = resp2.data;
          });
          specify("Then the response should contain the correct information about the event", function () {
            assert.strictEqual(
              responseBody.data.search.edges[0].node.action,
              "integrationminimum" + randomNumber.toString()
            );
            assert.strictEqual(responseBody.data.search.edges[0].node.is_anonymous, true);
            assert.strictEqual(responseBody.data.search.edges[0].node.crud, "c");
            assert.strictEqual(responseBody.data.search.edges[0].node.created, null);
            assert.strictEqual(responseBody.data.search.edges[0].node.description, null);
            assert.strictEqual(responseBody.data.search.edges[0].node.group.id, null);
            assert.strictEqual(responseBody.data.search.edges[0].node.target.name, null);
            assert.strictEqual(responseBody.data.search.edges[0].node.is_failure, null);
            assert.strictEqual(responseBody.data.search.edges[0].node.source_ip, null);
          });
        });
      }
    );
  });

  describe("Given the Retraced API is up and running", function () {
    const responseBody = {};
    let resultBody;
    beforeEach(retracedUp(Env));

    context("When a call is made into the Retraced API with the incorrect API key", function () {
      let httpResponse;
      beforeEach(async function () {
        const retraced = new Client({
          apiKey: Math.random().toString(36).substr(2, 186),
          projectId: Env.ProjectID,
          endpoint: Env.Endpoint,
        });

        const event = {
          action: "integrationminimum" + randomNumber.toString(),
          crud: "c" as CRUD,
          is_anonymous: true,
        };
        const valid = tv4.validate(event, CreateEventSchema);
        if (!valid) {
          console.log(tv4.error);
        }
        assert.strictEqual(valid, true);
        try {
          resultBody = await retraced.reportEvent(event);
          assert(resultBody);
        } catch (e) {
          httpResponse = e.message;
        }
      });

      specify(
        "Then the Retraced API should reject the call with a 401 Unauthorized and not return anything",
        function () {
          assert.deepStrictEqual(responseBody, {});
          assert.strictEqual(httpResponse.includes("401 Unauthorized"), true);
        }
      );
    });
  });

  describe("Given the Retraced API is up and running", function () {
    beforeEach(retracedUp(Env));

    context("When a call is made into the Retraced API with an invalid source_ip", function () {
      let resultBody, httpResponse;

      beforeEach(async function () {
        const retraced = new Client({
          apiKey: Env.ApiKey,
          projectId: Env.ProjectID,
          endpoint: Env.Endpoint,
        });

        const event = {
          source_ip: "localhost",
          action: "integrationinvalid" + randomNumber.toString(),
          crud: "c" as CRUD,
          is_anonymous: true,
        };

        try {
          resultBody = await retraced.reportEvent(event);
        } catch (e) {
          httpResponse = e.message;
        }
      });

      specify("The API should return a 400 response code.", async function () {
        assert.strictEqual(resultBody, undefined);
        assert.strictEqual(httpResponse.includes("400"), true);
      });
    });
  });
});
