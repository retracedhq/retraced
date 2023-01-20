import { expect } from "chai";
import * as Retraced from "@retracedhq/retraced";
import "mocha";
import "chai-http";
import { search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import * as util from "util";
import picocolors from "picocolors";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date().valueOf();
const now = new Date(currentTime);
const next = new Date(currentTime + 10000);
const later = new Date(currentTime + 20000);
const latest = new Date(currentTime + 30000);
now.setMilliseconds(0); // api only returns seconds precision
next.setMilliseconds(0); // api only returns seconds precision
later.setMilliseconds(0); // api only returns seconds precision
latest.setMilliseconds(0); // api only returns seconds precision

describe("Bulk Create Events", function () {
  describe("Given the Retraced API is up and running", function () {
    let responseBody: any = {};
    beforeEach(retracedUp(Env));

    context(
      "And a call is made into the Retraced API with a list of 4 audit events with different actors",
      () => {
        beforeEach(async function () {
          const retraced = new Retraced.Client({
            apiKey: Env.ApiKey,
            projectId: Env.ProjectID,
            endpoint: Env.Endpoint,
          });

          const events = [
            {
              action: "integrationbulk" + randomNumber.toString(),
              group: {
                id: "rtrcdqa1234",
                name: "RetracedQA",
              },
              created: now,
              crud: "c",
              source_ip: "192.168.0.1",
              actor: {
                id: "NOW@retraced.io",
                name: "RetracedQA Employee",
              },
            },
            {
              action: "integrationbulk" + randomNumber.toString(),
              group: {
                id: "rtrcdqa1234",
                name: "RetracedQA",
              },
              created: next,
              crud: "c",
              source_ip: "192.168.0.1",
              actor: {
                id: "NEXT@retraced.io",
                name: "RetracedQA Employee number 2",
              },
            },
            {
              action: "integrationbulk" + randomNumber.toString(),
              group: {
                id: "rtrcdqa1234",
                name: "RetracedQA",
              },
              created: later,
              crud: "c",
              source_ip: "192.168.0.1",
              actor: {
                id: "LATER@retraced.io",
                name: "RetracedQA Employee number 3",
              },
            },
            {
              action: "integrationbulk" + randomNumber.toString(),
              group: {
                id: "rtrcdqa1234",
                name: "RetracedQA",
              },
              created: latest,
              crud: "c",
              source_ip: "192.168.0.1",
              actor: {
                id: "LATEST@retraced.io",
                name: "RetracedQA Employee number 4",
              },
            },
          ];
          await retraced.reportEvents(events);
        });

        context("When a call is made to the GraphQL endpoint for the event", function () {
          beforeEach(function (done) {
            this.timeout(Env.EsIndexWaitMs * 2);
            sleep(Env.EsIndexWaitMs).then(() => {
              chai
                .request(Env.Endpoint)
                .post("/publisher/v1/graphql")
                .set("Authorization", "token=" + Env.ApiKey)
                .send(search("integrationbulk" + randomNumber.toString()))
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
          specify("Then the response should contain all four events", function () {
            expect(responseBody.data.search.edges.length).to.equal(4);
            expect(responseBody).to.have.nested.property(
              "data.search.edges[0].node.action",
              "integrationbulk" + randomNumber.toString()
            );
            expect(responseBody).to.have.nested.property(
              "data.search.edges[0].node.actor.id",
              "LATEST@retraced.io"
            );
            expect(responseBody).to.have.nested.property(
              "data.search.edges[0].node.created",
              isoDate(latest)
            );
            expect(responseBody).to.have.nested.property("data.search.edges[0].node.group.id", "rtrcdqa1234");
            expect(responseBody).to.have.nested.property("data.search.edges[0].node.crud", "c");
            expect(responseBody).to.have.nested.property(
              "data.search.edges[0].node.source_ip",
              "192.168.0.1"
            );

            expect(responseBody).to.have.nested.property(
              "data.search.edges[1].node.action",
              "integrationbulk" + randomNumber.toString()
            );
            expect(responseBody).to.have.nested.property(
              "data.search.edges[1].node.actor.id",
              "LATER@retraced.io"
            );
            expect(responseBody).to.have.nested.property("data.search.edges[1].node.created", isoDate(later));
            expect(responseBody).to.have.nested.property("data.search.edges[1].node.group.id", "rtrcdqa1234");
            expect(responseBody).to.have.nested.property("data.search.edges[1].node.crud", "c");
            expect(responseBody).to.have.nested.property(
              "data.search.edges[1].node.source_ip",
              "192.168.0.1"
            );

            expect(responseBody).to.have.nested.property(
              "data.search.edges[2].node.action",
              "integrationbulk" + randomNumber.toString()
            );
            expect(responseBody).to.have.nested.property(
              "data.search.edges[2].node.actor.id",
              "NEXT@retraced.io"
            );
            expect(responseBody).to.have.nested.property("data.search.edges[2].node.created", isoDate(next));
            expect(responseBody).to.have.nested.property("data.search.edges[2].node.group.id", "rtrcdqa1234");
            expect(responseBody).to.have.nested.property("data.search.edges[2].node.crud", "c");
            expect(responseBody).to.have.nested.property(
              "data.search.edges[2].node.source_ip",
              "192.168.0.1"
            );

            expect(responseBody).to.have.nested.property(
              "data.search.edges[3].node.action",
              "integrationbulk" + randomNumber.toString()
            );
            expect(responseBody).to.have.nested.property(
              "data.search.edges[3].node.actor.id",
              "NOW@retraced.io"
            );
            expect(responseBody).to.have.nested.property("data.search.edges[3].node.created", isoDate(now));
            expect(responseBody).to.have.nested.property("data.search.edges[3].node.group.id", "rtrcdqa1234");
            expect(responseBody).to.have.nested.property("data.search.edges[3].node.crud", "c");
            expect(responseBody).to.have.nested.property(
              "data.search.edges[3].node.source_ip",
              "192.168.0.1"
            );
          });
        });
      }
    );
  });
});
