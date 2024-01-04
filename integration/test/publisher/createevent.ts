import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema, GraphQLQuery, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import * as util from "util";
import picocolors from "picocolors";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

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
      });

      context("When a call is made to the GraphQL endpoint for the event", function () {
        beforeEach(function (done) {
          this.timeout(Env.EsIndexWaitMs * 2);
          sleep(Env.EsIndexWaitMs).then(() => {
            chai
              .request(Env.Endpoint)
              .post("/publisher/v1/graphql")
              .set("Authorization", "token=" + Env.ApiKey)
              .send(search("integration" + randomNumber.toString()))
              .end(function (err, res) {
                responseBody = JSON.parse(res.text);
                if (err && Env.Debug) {
                  console.log(picocolors.red(util.inspect(err.response.body, false, 100, false)));
                } else if (Env.Debug) {
                  console.log(util.inspect(res.body, false, 100, true));
                }
                assert.strictEqual(err, null);
                assert.strictEqual(res.status, 200);

                done();
              });
          });
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
        });

        context("When a call is made to the GraphQL endpoint for the event", function () {
          const thisQuery = GraphQLQuery;
          thisQuery.variables.query = "integrationminimum" + randomNumber.toString();
          beforeEach(function (done) {
            this.timeout(Env.EsIndexWaitMs * 2);
            sleep(Env.EsIndexWaitMs).then(() => {
              chai
                .request(Env.Endpoint)
                .post("/publisher/v1/graphql")
                .set("Authorization", "token=" + Env.ApiKey)
                .send(thisQuery)
                .end(function (err, res) {
                  responseBody = JSON.parse(res.text);
                  assert.strictEqual(err, null);
                  assert.strictEqual(res.status, 200);
                  done();
                });
            });
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
        } catch (e) {
          httpResponse = e.message;
        }
      });

      specify(
        "Then the Retraced API should reject the call with a 401 Unauthorized and not return anything",
        function () {
          assert.strictEqual(responseBody, {});
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
