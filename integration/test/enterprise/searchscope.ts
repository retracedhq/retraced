import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Enterprise Search Group Scoping", function () {
  describe("Given the Retraced API is up and running", function () {
    let resultBody;
    let responseBody;
    let token;
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
        });

        context("When a call is made to create an eitapi token for a Replicated group", function () {
          beforeEach((done) => {
            if (otherToken) {
              done();
              return;
            }
            chai
              .request(Env.Endpoint)
              .post(`/publisher/v1/project/${Env.ProjectID}/group/replqa1234/enterprisetoken`)
              .set("Authorization", `token=${Env.ApiKey}`)
              .send({ display_name: "QA" + randomNumber.toString() })
              .end(function (err, res) {
                responseBody = JSON.parse(res.text);
                assert.strictEqual(err, null);
                assert.strictEqual(res.status, 201);
                assert(responseBody.token);
                otherToken = responseBody.token;
                done();
              });
          });

          context(
            "And the eitapi token is used to call the Enterprise API GraphQL endpoint for event",
            function () {
              beforeEach(function (done) {
                this.timeout(Env.EsIndexWaitMs * 2);
                sleep(Env.EsIndexWaitMs).then(() => {
                  chai
                    .request(Env.Endpoint)
                    .post("/enterprise/v1/graphql")
                    .set("Authorization", `token=${otherToken}`)
                    .send(search("integration.test.api." + randomNumber.toString()))
                    .end(function (err, res) {
                      responseBody = JSON.parse(res.text);
                      assert.strictEqual(err, null);
                      assert.strictEqual(res.status, 200);
                      done();
                    });
                });
              });
              specify("Then the response should not include the event from Retraced Group", function () {
                assert.strictEqual(responseBody.data.search.edges, []);
              });
            }
          );
        });
      }
    );
  });
});
