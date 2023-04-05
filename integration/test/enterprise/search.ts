import { expect } from "chai";
import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

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
        expect(valid).to.be.true;
        resultBody = await retraced.reportEvent(event);
      });

      context(
        "When a call is made to create an eitapi token using the Publisher API with a custom view_log_action",
        function () {
          beforeEach((done) => {
            if (token) {
              done();
              return;
            }
            chai
              .request(Env.Endpoint)
              .post(`/publisher/v1/project/${Env.ProjectID}/group/rtrcdqa1234/enterprisetoken`)
              .set("Authorization", `token=${Env.ApiKey}`)
              .send({
                display_name: "QA" + randomNumber.toString(),
                view_log_action: "viewlogs.custom",
              })
              .end(function (err, res) {
                responseBody = JSON.parse(res.text);
                expect(err).to.be.null;
                expect(res).to.have.property("status", 201);
                expect(responseBody.token).to.exist;
                token = responseBody.token;
                done();
              });
          });

          context(
            "And the eitapi token is used to call the Enterprise API GraphQL endpoint for the event",
            function () {
              let responseBody;
              beforeEach(function (done) {
                this.timeout(Env.EsIndexWaitMs * 2);
                sleep(Env.EsIndexWaitMs).then(() => {
                  chai
                    .request(Env.Endpoint)
                    .post("/enterprise/v1/graphql")
                    .set("Authorization", `token=${token}`)
                    .send(search("integration" + randomNumber.toString()))
                    .end(function (err, res) {
                      responseBody = JSON.parse(res.text);
                      expect(res).to.have.property("status", 200);
                      expect(err).to.be.null;
                      done();
                    });
                });
              });
              specify(
                "Then the response should contain the correct information about the event",
                function () {
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.action",
                    "integration" + randomNumber.toString()
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.created",
                    isoDate(currentTime)
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.description",
                    "Automated integration testing..."
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.actor.fields[0].key",
                    "department"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.actor.fields[0].value",
                    "QA"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.group.id",
                    "rtrcdqa1234"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.target.name",
                    "Retraced API"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.target.fields[0].key",
                    "record_count"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.target.fields[0].value",
                    "100"
                  );
                  expect(responseBody).to.have.nested.property("data.search.edges[0].node.is_failure", false);
                  expect(responseBody).to.have.nested.property("data.search.edges[0].node.crud", "c");
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.source_ip",
                    "192.168.0.1"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.fields[0].key",
                    "quality"
                  );
                  expect(responseBody).to.have.nested.property(
                    "data.search.edges[0].node.fields[0].value",
                    "excellent"
                  );
                }
              );
            }
          );

          context("When a second call is made to the Enterprise API GraphQL endpoint", function () {
            let responseBody;
            beforeEach(function (done) {
              this.timeout(Env.EsIndexWaitMs * 2);
              sleep(Env.EsIndexWaitMs).then(() => {
                chai
                  .request(Env.Endpoint)
                  .post("/enterprise/v1/graphql")
                  .set("Authorization", `token=${token}`)
                  .send(search("viewlogs.custom"))
                  .end(function (err, res) {
                    responseBody = JSON.parse(res.text);
                    expect(err).to.be.null;
                    expect(res).to.have.property("status", 200);
                    done();
                  });
              });
            });
            specify(
              "Then the most recent event should be a viewlogs.custom event with the enterprise token specified as the actor",
              function () {
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.action",
                  "viewlogs.custom"
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.group.id",
                  "rtrcdqa1234"
                );
                expect(responseBody).to.have.nested.property("data.search.edges[0].node.crud", "r");
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.actor.id",
                  "enterprise:" + token.substring(0, 7)
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.actor.name",
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
