import * as querystring from "querystring";
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
currentTime.setMilliseconds(0); // api only returns seconds preceision

describe("Viewer API", function () {
  describe("Given the Retraced API is up and running", function () {
    const groupID = "rtrcdqa" + randomNumber.toString();
    const targetID = "rtrcdapi";
    const actorID = "qa@retraced.io";

    let resultBody;
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
        expect(valid).to.be.true;
        resultBody = await retraced.reportEvent(event);
      });

      context("And a call is made to create a viewer description scoped to a target", function () {
        let token;

        beforeEach((done) => {
          const opts = {
            actor_id: actorID,
            group_id: groupID,
            target_id: targetID,
          };
          const qs = querystring.stringify(opts);

          chai
            .request(Env.Endpoint)
            .get(`/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`)
            .set("Authorization", `Token token=${Env.ApiKey}`)
            .end((err, res) => {
              expect(err).to.be.null;
              token = res.body.token;
              done();
            });
        });

        context("And the viewer descriptor is exchanged for a session", function () {
          let viewerSession;
          beforeEach((done) => {
            chai
              .request(Env.Endpoint)
              .post("/viewer/v1/viewersession")
              .send({ token })
              .end(function (err, res) {
                viewerSession = JSON.parse(res.text).token;
                expect(err).to.be.null;
                expect(res).to.have.property("status", 200);
                done();
              });
          });

          context("When a call is made to the Viewer API GraphQL endpoint for the event", function () {
            let responseBody;
            beforeEach(function (done) {
              this.timeout(Env.EsIndexWaitMs * 2);
              sleep(Env.EsIndexWaitMs).then(() => {
                chai
                  .request(Env.Endpoint)
                  .post("/viewer/v1/graphql")
                  .set("Authorization", viewerSession)
                  .send(search("integration.test.api." + randomNumber.toString()))
                  .end(function (err, res) {
                    responseBody = JSON.parse(res.text);
                    expect(err).to.be.null;
                    expect(res).to.have.property("status", 200);
                    done();
                  });
              });
            });
            specify("Then the response should contain the correct information about the event", function () {
              expect(responseBody).to.have.nested.property(
                "data.search.edges[0].node.action",
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
          beforeEach((done) => {
            chai
              .request(Env.Endpoint)
              .post("/viewer/v1/viewersession")
              .send({ token })
              .end(function (err, res) {
                viewerSession = JSON.parse(res.text).token;
                expect(err).to.be.null;
                expect(res).to.have.property("status", 200);
                done();
              });
          });

          context("When a call is made to the Viewer API GraphQL endpoint for the event", function () {
            let responseBody;
            beforeEach(function (done) {
              this.timeout(Env.EsIndexWaitMs * 2);
              sleep(Env.EsIndexWaitMs).then(() => {
                chai
                  .request(Env.Endpoint)
                  .post("/viewer/v1/graphql")
                  .set("Authorization", viewerSession)
                  .send(search("integration.test.api." + randomNumber.toString()))
                  .end(function (err, res) {
                    responseBody = JSON.parse(res.text);
                    expect(err).to.be.null;
                    expect(res).to.have.property("status", 200);
                    done();
                  });
              });
            });

            specify("Then the response should contain the correct information about the event", function () {
              expect(responseBody).to.have.nested.property(
                "data.search.edges[0].node.action",
                "integration.test.api." + randomNumber.toString()
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
                "rtrcdqa" + randomNumber.toString()
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
            });
          });
          context("When a second call is made to the Viewer API GraphQL endpoint", function () {
            let responseBody;
            beforeEach(function (done) {
              this.timeout(Env.EsIndexWaitMs * 2);
              sleep(Env.EsIndexWaitMs).then(() => {
                chai
                  .request(Env.Endpoint)
                  .post("/viewer/v1/graphql")
                  .set("Authorization", viewerSession)
                  .send(search("audit.log.view"))
                  .end(function (err, res) {
                    responseBody = JSON.parse(res.text);
                    expect(err).to.be.null;
                    expect(res).to.have.property("status", 200);
                    done();
                  });
              });
            });
            specify(
              "Then the most recent event should be an audit.log.view event with the actor specified",
              function () {
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.action",
                  "audit.log.view"
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.group.id",
                  "rtrcdqa" + randomNumber.toString()
                );
                expect(responseBody).to.have.nested.property("data.search.edges[0].node.crud", "r");
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.actor.id",
                  "qa@retraced.io"
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.actor.name",
                  "RetracedQA Employee"
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.actor.fields[0].key",
                  "department"
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.actor.fields[0].value",
                  "QA"
                );
              }
            );
          });
        });
      });
    });
  });
});
