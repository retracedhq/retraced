import * as querystring from "querystring";
import { Client, CRUD } from "@retracedhq/retraced";
import "mocha";
import "chai-http";
import { retracedUp } from "../pkg/retracedUp";
import * as Env from "../env";
import * as jwt from "jsonwebtoken";
import { sleep } from "../pkg/util";
import * as _ from "lodash";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;

describe("Viewer API", function () {
  describe("Given the Retraced API is up and running", function () {
    const groupID = "rtrcdqa" + randomNumber.toString();
    const actorID = "qa@retraced.io";

    let resultBody;
    beforeEach(retracedUp(Env));

    context("And a call is made to create a viewer description scoped to a group", function () {
      let token;

      beforeEach((done) => {
        const opts = {
          group_id: groupID,
          // TODO why is actorID required?
          actor_id: actorID,
        };
        const qs = querystring.stringify(opts);

        chai
          .request(Env.Endpoint)
          .get(`/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`)
          .set("Authorization", `Token token=${Env.ApiKey}`)
          .end((err, res) => {
            assert.strictEqual(err, null);
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
            .end(function (err, res: any) {
              viewerSession = JSON.parse(res.text).token;
              assert.strictEqual(err, null);
              assert.strictEqual(res.status, 200);
              done();
            });
        });

        context("When a call is made to the Viewer API create saved export endpoint", function () {
          let responseBody;

          beforeEach(function (done) {
            chai
              .request(Env.Endpoint)
              .post(`/viewer/v1/project/${Env.ProjectID}/export`)
              .set("Authorization", viewerSession)
              .send({
                name: "Test Name",
                exportBody: JSON.stringify({
                  searchQuery: "",
                  showCreate: true,
                  showDelete: true,
                  showRead: true,
                  showUpdate: true,
                  version: 1,
                  startTime: Date.now() - 60000,
                  endTime: Date.now() + 60000,
                }),
              })
              .end((err, res) => {
                responseBody = JSON.parse(res.text);
                assert.strictEqual(err, null);
                assert.strictEqual(res.status, 201);
                done();
              });
          });

          specify("Then the response should contain the new saved export.", function () {
            assert(responseBody.id);
          });

          // This test only runs in dev where we know the JWT signing secret. Dev should
          // also set env EXPORT_PAGE_SIZE_INTERNAL low enough to exercise the cursor and
          // accumulation logic in saved_export/render.ts.
          if (process.env.HMAC_SECRET_VIEWER) {
            const eventCount = 5;
            let ids: string[] = [];

            context("When the export is rendered", function () {
              beforeEach(async function () {
                this.timeout(Env.EsIndexWaitMs * 3);

                const retraced = new Client({
                  apiKey: Env.ApiKey,
                  projectId: Env.ProjectID,
                  endpoint: Env.Endpoint,
                });

                const events = _.map(_.range(eventCount), () => ({
                  action: "integration" + randomNumber.toString(),
                  group: {
                    id: groupID,
                    name: "RetracedQA",
                  },
                  created: new Date(),
                  crud: "c" as CRUD,
                  source_ip: "192.168.0.1",
                  actor: {
                    id: "qa@retraced.io",
                  },
                  description: "Automated integration testing...",
                }));

                ids = await Promise.all(
                  events.map((event) => {
                    return retraced.reportEvent(event);
                  })
                );
                await sleep(Env.EsIndexWaitMs * 2);
              });

              specify("Then the response should contain matching events.", function (done) {
                this.timeout(Env.EsIndexWaitMs * 3);
                const desc = {
                  environmentId: Env.EnvironmentID,
                  groupId: groupID,
                  id: token,
                };
                const tkn = jwt.sign(desc, process.env.HMAC_SECRET_VIEWER);
                chai
                  .request(Env.Endpoint)
                  .get(`/viewer/v1/project/${Env.ProjectID}/export/${responseBody.id}/rendered?jwt=${tkn}`)
                  .end((err, res) => {
                    assert.strictEqual(err, null);
                    assert.strictEqual(res.status, 200);
                    assert.strictEqual(res.text.split("\n").length, eventCount + 2);
                    _.each(ids, function (id) {
                      assert(res.text.match(new RegExp(id)));
                    });
                  });
              });
            });
          }
        });
      });
    });
  });
});
