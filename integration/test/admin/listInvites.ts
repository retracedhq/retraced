import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin list invites", function () {
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

    context("And an admin user is logged in to a project with two invites", function () {
      const emails = ["invitee1@retraced.io", "invitee2@retraced.io"];
      const inviteIDs: string[] = [];

      before(async function () {
        const admin: any = await adminUser(Env);

        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      emails.forEach((email) => {
        before(function (done) {
          chai
            .request(Env.Endpoint)
            .post(`/admin/v1/project/${project.id}/invite`)
            .set("Authorization", jwt)
            .send({ email })
            .end((err, res) => {
              assert.strictEqual(err, null);
              inviteIDs.push(res.body.id);
              done();
            });
        });
      });

      context("When a call is made to list invites", function () {
        let resp;

        before(function (done) {
          chai
            .request(Env.Endpoint)
            .get(`/admin/v1/project/${project.id}/invite`)
            .set("Authorization", jwt)
            .end((err, res) => {
              assert.strictEqual(err, null);
              resp = res;
              done();
            });
        });

        specify("Both invites should be returned with status 200.", function () {
          assert.strictEqual(resp.status, 200);

          assert.strictEqual(resp.body[0].id, inviteIDs[0]);
          assert.strictEqual(resp.body[0].email, emails[0]);
          assert.strictEqual(resp.body[1].id, inviteIDs[1]);
          assert.strictEqual(resp.body[1].email, emails[1]);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The read is audited under the headless project.", async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "r",
              action: "invite.list",
            };
            const mask = {
              action: true,
              crud: true,
              actor: {
                id: true,
              },
              group: {
                id: true,
              },
            };
            const connection = await headless.query(query, mask, 1);
            const audited = connection.currentResults[0];

            assert.strictEqual(audited.action, "invite.list");
            assert.strictEqual(audited.crud, "r");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
          });
        }
      });
    });
  });
});
