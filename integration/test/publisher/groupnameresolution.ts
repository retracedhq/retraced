import { expect } from "chai";
import { Client, CRUD } from "../../../src/_lib/index";
import "mocha";
import "chai-http";
import { search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep } from "../pkg/util";
import * as Env from "../env";
import * as util from "util";
import picocolors from "picocolors";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const FIRST_EVENT = randomNumber.toString();
const SECOND_EVENT = (randomNumber + 1).toString();
const GROUP_ID = (randomNumber + 2).toString();
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Group Name Resolution", function () {
  describe("Given the Retraced API is up and running", function () {
    let responseBody: any = {};
    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with only a group.id", () => {
      beforeEach(async function () {
        const retraced = new Client({
          apiKey: Env.ApiKey,
          projectId: Env.ProjectID,
          endpoint: Env.Endpoint,
        });

        const event: Event = {
          action: "integration" + FIRST_EVENT,
          group: {
            id: "rtrcdqa1234" + GROUP_ID,
          },
          is_anonymous: true,
          crud: "r",
        };
        await retraced.reportEvent(event);
      });
      context(
        "And another call is made into the Retraced API with the same group.id and a group.name",
        () => {
          beforeEach(function (done) {
            const retraced = new Client({
              apiKey: Env.ApiKey,
              projectId: Env.ProjectID,
              endpoint: Env.Endpoint,
            });

            const event: Event = {
              action: "integration" + SECOND_EVENT,
              group: {
                id: "rtrcdqa1234" + GROUP_ID,
                name: "group number " + GROUP_ID,
              },
              is_anonymous: true,
              crud: "r",
            };
            retraced.reportEvent(event).then((id) => done());
          });

          context("When a call is made to the GraphQL endpoint for the first event", function () {
            beforeEach(function (done) {
              this.timeout(Env.EsIndexWaitMs * 2);
              sleep(Env.EsIndexWaitMs).then(() => {
                chai
                  .request(Env.Endpoint)
                  .post("/publisher/v1/graphql")
                  .set("Authorization", "token=" + Env.ApiKey)
                  .send(search("integration" + FIRST_EVENT))
                  .end(function (err, res) {
                    responseBody = JSON.parse(res.text);
                    if (err && Env.Debug) {
                      console.log(picocolors.red(util.inspect(err.response.body, false, 100, false)));
                    } else if (Env.Debug) {
                      console.log(util.inspect(res.body, false, 100, true));
                    }
                    expect(err).to.be.null;
                    expect(res).to.have.property("status", 200);

                    done();
                  });
              });
            });
            specify(
              "Then the response should contain a non-null group.id, and the second event's group.name should be populated",
              function () {
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.action",
                  "integration" + FIRST_EVENT
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.group.id",
                  "rtrcdqa1234" + GROUP_ID
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.group.name",
                  "group number " + GROUP_ID
                );
              }
            );
          });

          context("When a call is made to the GraphQL endpoint for the second event", function () {
            beforeEach(function (done) {
              this.timeout(Env.EsIndexWaitMs * 2);
              sleep(Env.EsIndexWaitMs).then(() => {
                chai
                  .request(Env.Endpoint)
                  .post("/publisher/v1/graphql")
                  .set("Authorization", "token=" + Env.ApiKey)
                  .send(search("integration" + SECOND_EVENT))
                  .end(function (err, res) {
                    responseBody = JSON.parse(res.text);
                    if (err && Env.Debug) {
                      console.log(picocolors.red(util.inspect(err.response.body, false, 100, false)));
                    } else if (Env.Debug) {
                      console.log(util.inspect(res.body, false, 100, true));
                    }
                    expect(err).to.be.null;
                    expect(res).to.have.property("status", 200);

                    done();
                  });
              });
            });
            specify(
              "Then the response should contain a non-null group.id, and the second event's group.name should be populated",
              function () {
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.action",
                  "integration" + SECOND_EVENT
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.group.id",
                  "rtrcdqa1234" + GROUP_ID
                );
                expect(responseBody).to.have.nested.property(
                  "data.search.edges[0].node.group.name",
                  "group number " + GROUP_ID
                );
              }
            );
          });
        }
      );
    });
  });
});
