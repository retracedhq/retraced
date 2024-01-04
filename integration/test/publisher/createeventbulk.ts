import { Client, CRUD } from "@retracedhq/retraced";
import "mocha";
import "chai-http";
import { search } from "../pkg/specs";
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
          const retraced = new Client({
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
              crud: "c" as CRUD,
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
              crud: "c" as CRUD,
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
              crud: "c" as CRUD,
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
              crud: "c" as CRUD,
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
                  assert.strictEqual(err, null);
                  assert.strictEqual(res.status, 200);

                  done();
                });
            });
          });
          specify("Then the response should contain all four events", function () {
            assert.strictEqual(responseBody.data.search.edges.length, 4);
            assert.strictEqual(
              responseBody.data.search.edges[0].node.action,
              "integrationbulk" + randomNumber.toString()
            );
            assert.strictEqual(responseBody.data.search.edges[0].node.actor.id, "LATEST@redtraced.io");
            assert.strictEqual(responseBody.data.search.edges[0].node.created, isoDate(latest));
            assert.strictEqual(responseBody.data.search.edges[0].node.group.id, "rtrcdqa1234");
            assert.strictEqual(responseBody.data.search.edges[0].node.crud, "c");
            assert.strictEqual(responseBody.data.search.edges[0].node.source_ip, "192.168.0.1");

            assert.strictEqual(
              responseBody.data.search.edges[1].node.action,
              "integrationbulk" + randomNumber.toString()
            );
            assert.strictEqual(responseBody.data.search.edges[1].node.actor.id, "LATER@retraced.io");
            assert.strictEqual(responseBody.data.search.edges[1].node.created, isoDate(later));
            assert.strictEqual(responseBody.data.search.edges[1].node.group.id, "rtrcdqa1234");
            assert.strictEqual(responseBody.data.search.edges[1].node.crud, "c");
            assert.strictEqual(responseBody.data.search.edges[1].node.source_ip, "192.168.0.1");

            assert.strictEqual(
              responseBody.data.search.edges[2].node.action,
              "integrationbulk" + randomNumber.toString()
            );
            assert.strictEqual(responseBody.data.search.edges[2].node.actor.id, "NEXT@retraced.io");
            assert.strictEqual(responseBody.data.search.edges[2].node.created, isoDate(next));
            assert.strictEqual(responseBody.data.search.edges[2].node.group.id, "rtrcdqa1234");
            assert.strictEqual(responseBody.data.search.edges[2].node.crud, "c");
            assert.strictEqual(responseBody.data.search.edges[2].node.source_ip, "192.168.0.1");

            assert.strictEqual(
              responseBody.data.search.edges[3].node.action,
              "integrationbulk" + randomNumber.toString()
            );
            assert.strictEqual(responseBody.data.search.edges[3].node.actor.id, "NOW@retraced.io");
            assert.strictEqual(responseBody.data.search.edges[3].node.created, isoDate(now));
            assert.strictEqual(responseBody.data.search.edges[3].node.group.id, "rtrcdqa1234");
            assert.strictEqual(responseBody.data.search.edges[3].node.crud, "c");
            assert.strictEqual(responseBody.data.search.edges[3].node.source_ip, "192.168.0.1");
          });
        });
      }
    );
  });
});
