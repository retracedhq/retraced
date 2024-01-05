import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Listing Enterprise Tokens", function () {
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
      });

      context("And at least one eitapi token exists", function () {
        beforeEach((done) => {
          chai
            .request(Env.Endpoint)
            .post(`/publisher/v1/project/${Env.ProjectID}/group/rtrcdqa1234/enterprisetoken`)
            .set("Authorization", `token=${Env.ApiKey}`)
            .send({ display_name: "QA" + randomNumber.toString() })
            .end(function (err, res) {
              responseBody = JSON.parse(res.text);
              assert.strictEqual(err, null);
              assert.strictEqual(res.status, 201);
              assert(responseBody.token);
              token = responseBody.token;
              done();
            });
        });
        context("When a call is made to list eitapi API tokens", function () {
          let tokens;
          beforeEach((done) => {
            chai
              .request(Env.Endpoint)
              .get(`/publisher/v1/project/${Env.ProjectID}/group/rtrcdqa1234/enterprisetoken`)
              .set("Authorization", `token=${Env.ApiKey}`)
              .end(function (err, res) {
                tokens = JSON.parse(res.text);
                assert.strictEqual(err, null);
                assert.strictEqual(res.status, 200);
                done();
              });
          });
          specify("Then the response should contain at least one enterprise token ", function () {
            assert.strictEqual(tokens.length > 0, true);
            assert(tokens[0].token);
          });

          context(
            "When one of those tokens is used to call the Enterprise API GraphQL endpoint for the event",
            function () {
              let responseBody;
              beforeEach(function (done) {
                this.timeout(Env.EsIndexWaitMs * 2);
                sleep(Env.EsIndexWaitMs).then(() => {
                  chai
                    .request(Env.Endpoint)
                    .post("/enterprise/v1/graphql")
                    .set("Authorization", `token=${tokens[0].token}`)
                    .send(search("integration" + randomNumber.toString()))
                    .end(function (err, res) {
                      responseBody = JSON.parse(res.text);
                      assert.strictEqual(err, null);
                      assert.strictEqual(res.status, 200);
                      done();
                    });
                });
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
        });
      });
    });
  });
});
