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

describe("Admin create API token", function () {
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

    context("And an admin user is logged in", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      context("When a new API token is created", function () {
        let resp;

        before(function (done) {
          chai
            .request(Env.Endpoint)
            .post(`/admin/v1/project/${project.id}/token?environment_id=${env.id}`)
            .set("Authorization", jwt)
            .send({
              name,
              disabled: false,
            })
            .end((err, res) => {
              assert.strictEqual(err, null);
              resp = res;
              done();
            });
        });

        specify("The token resource is returned with status 201.", function () {
          const token = resp.body;
          const tenMinutes = 1000 * 60 * 10;

          assert.strictEqual(resp.status, 201);
          assert(token.token);
          assert(token.created);
          expect(new Date(token.created).getTime()).to.be.within(
            Date.now() - tenMinutes,
            Date.now() + tenMinutes
          );
          assert.strictEqual(token.name, name);
          assert.strictEqual(token.disabled, false);
          assert.strictEqual(token.project_id, project.id);
          assert.strictEqual(token.environment_id, env.id);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The creation is audited under the headless project.", async function () {
            this.timeout(10000);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "c",
              action: "api_token.create",
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

            assert.strictEqual(audited.action, "api_token.create");
            assert.strictEqual(audited.crud, "c");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
            assert(audited.target!.id);
            assert.deepStrictEqual(audited.target!.fields, {
              name,
              disabled: "false",
            });
          });
        }
      });
    });
  });
});
