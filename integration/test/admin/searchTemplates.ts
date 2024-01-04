import * as querystring from "querystring";
import { expect } from "chai";
import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin search templates", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Client({
    apiKey: Env.HeadlessApiKey,
    projectId: Env.HeadlessProjectID,
    endpoint: Env.Endpoint,
  });

  let project;
  let env;
  let jwt;
  let adminId;

  context("Given the Retraced API is up and running", function () {
    before(retracedUp(Env));

    context("And an admin user is logged in", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      context("In an environment with no templates", function () {
        let resp;

        context("When the admin searches for templates", function () {
          beforeEach(function (done) {
            chai
              .request(Env.Endpoint)
              .get(`/admin/v1/project/${project.id}/templates?environment_id=${env.id}`)
              .set("Authorization", jwt)
              .end((err, res) => {
                assert.strictEqual(err, null);
                resp = res;
                done();
              });
          });

          specify("The API should return an empty set of results with status 200", function () {
            assert.strictEqual(resp.status, 200);

            assert.deepStrictEqual(resp.body, {
              total_hits: 0,
              templates: [],
            });
          });

          if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
            specify("The search is audited under the headless project.", async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);
              const query = {
                crud: "r",
                action: "template.search",
              };
              const mask = {
                action: true,
                crud: true,
                actor: {
                  id: true,
                },
                target: {
                  id: true,
                  name: true,
                  fields: true,
                },
                group: {
                  id: true,
                },
              };
              const connection = await headless.query(query, mask, 1);
              const audited = connection.currentResults[0];
              const token = resp.body;

              expect(audited.action).to.equal("template.search");
              expect(audited.crud).to.equal("r");
              expect(audited.group!.id).to.equal(project.id);
              expect(audited.actor!.id).to.equal(adminId);
            });
          }
        });
      });

      context("In an environment with two templates", function () {
        for (let i = 0; i < 2; i++) {
          before(function (done) {
            chai
              .request(Env.Endpoint)
              .post(`/admin/v1/project/${project.id}/templates?environment_id=${env.id}`)
              .set("Authorization", jwt)
              .send({
                name: i === 0 ? "Z" : "A",
                rule: "always",
                template: "{{}}",
              })
              .end((err, res) => {
                expect(err).to.be.null;
                done();
              });
          });
        }

        context("When an admin searches for templates with length=1 offset=0", function () {
          let resp;

          before(function (done) {
            const qs = querystring.stringify({
              environment_id: env.id,
              offset: 0,
              length: 1,
            });
            chai
              .request(Env.Endpoint)
              .get(`/admin/v1/project/${project.id}/templates?${qs}`)
              .set("Authorization", jwt)
              .end((err, res) => {
                expect(err).to.be.null;
                resp = res;
                done();
              });
          });

          specify("The first template in alphabetical order should be returned.", function () {
            expect(resp.status).to.equal(200);

            expect(resp.body).to.have.property("total_hits", 1);
            expect(resp.body.templates[0]).to.have.property("name", "A");
          });
        });

        context("When an admin searches for templates with offset=1", function () {
          let resp;

          before(function (done) {
            const qs = querystring.stringify({
              environment_id: env.id,
              offset: 1,
            });
            chai
              .request(Env.Endpoint)
              .get(`/admin/v1/project/${project.id}/templates?${qs}`)
              .set("Authorization", jwt)
              .end((err, res) => {
                expect(err).to.be.null;
                resp = res;
                done();
              });
          });

          specify("The first template in alphabetical order should be returned.", function () {
            expect(resp.status).to.equal(200);

            expect(resp.body).to.have.property("total_hits", 1);
            expect(resp.body.templates[0]).to.have.property("name", "Z");
          });
        });
      });
    });
  });
});
