import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin delete environment", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Client({
    apiKey: Env.HeadlessApiKey,
    projectId: Env.HeadlessProjectID,
    endpoint: Env.Endpoint,
  });
  const name = "New Token Name";
  let project;
  let env;
  let jwt;
  let adminId;

  context("Given the Retraced API is up and running", function () {
    before(retracedUp(Env));

    context(
      "And an admin user is logged in to a project with an environment that can be deleted",
      function () {
        let templateID;
        let resp;

        before(async function () {
          const admin: any = await adminUser(Env);
          jwt = admin.jwt;
          project = admin.project;
          env = admin.project.environments[0];
          adminId = admin.userId;
        });

        before(function (done) {
          chai
            .request(Env.Endpoint)
            .post(`/admin/v1/project/${project.id}/environment/${env.id}/deletion_request`)
            .set("Authorization", jwt)
            .send({
              resourceKind: "environment",
              resourceId: env.id,
            })
            .end((err, resp) => {
              assert.strictEqual(err, null);
              assert.strictEqual(resp.status, 201);
              done();
            });
        });

        before(function (done) {
          chai
            .request(Env.Endpoint)
            .post(`/admin/v1/project/${project.id}/templates?environment_id=${env.id}`)
            .set("Authorization", jwt)
            .send({
              name: "Delete Template Test",
              rule: "always",
              template: "{{}}",
            })
            .end((err, res) => {
              assert.strictEqual(err, null);
              assert.strictEqual(res.status, 201);

              templateID = res.body.id;
              done();
            });
        });

        context("When the admin sends a request to delete the environment", function () {
          before(function (done) {
            chai
              .request(Env.Endpoint)
              .delete(`/admin/v1/project/${project.id}/environment/${env.id}`)
              .set("Authorization", jwt)
              .end((err, res) => {
                assert.strictEqual(err, null);
                resp = res;
                done();
              });
          });

          specify("The environment is deleted with status 204.", function () {
            assert.strictEqual(resp.status, 204);
            assert.deepEqual(resp.body, {});
          });

          if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
            specify("The deletion is audited under the headless project.", async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);
              const query = {
                crud: "d",
                action: "environment.delete",
              };
              const mask = {
                action: true,
                crud: true,
                actor: {
                  id: true,
                },
                target: {
                  id: true,
                },
                group: {
                  id: true,
                },
              };
              const connection = await headless.query(query, mask, 1);
              const audited = connection.currentResults[0];

              assert.strictEqual(audited.action, "environment.delete");
              assert.strictEqual(audited.crud, "d");
              assert.strictEqual(audited.group!.id, project.id);
              assert.strictEqual(audited.actor!.id, adminId);
              assert.strictEqual(audited.target!.id, env.id);
            });
          }
        });
      }
    );
  });
});
