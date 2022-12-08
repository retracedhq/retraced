import { expect } from "chai";
import * as Retraced from "@retraced-hq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";

// tslint:disable-next-line
const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin list invites", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Retraced.Client({
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

    context(
      "And an admin user is logged in to a project with two invites",
      function () {
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
                expect(err).to.be.null;
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
                expect(err).to.be.null;
                resp = res;
                done();
              });
          });

          specify(
            "Both invites should be returned with status 200.",
            function () {
              expect(resp.status).to.equal(200);

              expect(resp.body[0]).to.have.property("id", inviteIDs[0]);
              expect(resp.body[0]).to.have.property("email", emails[0]);
              expect(resp.body[1]).to.have.property("id", inviteIDs[1]);
              expect(resp.body[1]).to.have.property("email", emails[1]);
            }
          );

          specify(
            "The read is audited under the headless project.",
            async function () {
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
              const token = resp.body;

              expect(audited.action).to.equal("invite.list");
              expect(audited.crud).to.equal("r");
              expect(audited.group!.id).to.equal(project.id);
              expect(audited.actor!.id).to.equal(adminId);
            }
          );
        });
      }
    );
  });
});
