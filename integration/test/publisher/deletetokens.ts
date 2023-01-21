import { expect } from "chai";
import * as Retraced from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import * as Env from "../env";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds preceision

describe("Deleting Enterprise Tokens", function () {
  describe("Given the Retraced API is up and running", function () {
    let resultBody;
    let responseBody;
    let token;
    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with a standard audit event", function () {
      beforeEach(async function () {
        const retraced = new Retraced.Client({
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
          crud: "c",
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

      context("And at least one eitapi token exists", function () {
        beforeEach((done) => {
          if (token) {
            done();
            return;
          }
          chai
            .request(Env.Endpoint)
            .post(`/publisher/v1/project/${Env.ProjectID}/group/rtrcdqa1234/enterprisetoken`)
            .set("Authorization", `token=${Env.ApiKey}`)
            .send({ display_name: "QA" + randomNumber.toString() })
            .end(function (err, res) {
              responseBody = JSON.parse(res.text);
              expect(err).to.be.null;
              expect(res).to.have.property("status", 201);
              expect(responseBody.token).to.exist;
              token = responseBody.token;
              done();
            });
        });

        context("When one of the tokens is deleted", function () {
          beforeEach(function (done) {
            chai
              .request(Env.Endpoint)
              .delete(`/publisher/v1/project/${Env.ProjectID}/group/rtrcdqa1234/enterprisetoken/${token}`)
              .set("Authorization", `token=${Env.ApiKey}`)
              .send({ display_name: "QA" + randomNumber.toString() })
              .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.property("status", 204);
                expect(responseBody.token).to.exist;
                token = responseBody.token;
                done();
              });
          });
          context("And that token is used to query the graphql endpoint", function () {
            let response;
            beforeEach(function (done) {
              chai
                .request(Env.Endpoint)
                .post("/enterprise/v1/graphql")
                .set("Authorization", `token=${token}`)
                .send(search("integration.test.api." + randomNumber.toString()))
                .end(function (err, res) {
                  response = res;
                  done();
                });
            });

            specify("Then the response should be a 401", function () {
              expect(response).to.have.property("status", 401);
            });
          });
        });
      });
    });
  });
});
