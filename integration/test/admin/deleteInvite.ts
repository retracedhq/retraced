import { expect } from "chai";
import * as Retraced from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin delete invite", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Retraced.Client({
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
      "And an admin user is logged in to an environment with an outstanding invite",
      function () {
        const email = "newperson@retraced.io";
        let inviteID;

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
            .post(`/admin/v1/project/${project.id}/invite`)
            .set("Authorization", jwt)
            .send({ email })
            .end((err, res) => {
              expect(err).to.be.null;
              inviteID = res.body.id;
              done();
            });
        });

        context("When the admin deletes the invite", function () {
          let resp;

          before(function (done) {
            chai
              .request(Env.Endpoint)
              .delete(`/admin/v1/project/${project.id}/invite/${inviteID}`)
              .set("Authorization", jwt)
              .end((err, res) => {
                expect(err).to.be.null;
                resp = res;
                done();
              });
          });

          specify("It should be deleted with status 204.", function () {
            expect(resp.status).to.equal(204);
            expect(resp.body).to.deep.equal({});
          });

          specify(
            "The deletion is audited under the headless project.",
            async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);
              const query = {
                crud: "d",
                action: "invite.delete",
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
              const token = resp.body;

              expect(audited.action).to.equal("invite.delete");
              expect(audited.crud).to.equal("d");
              expect(audited.group!.id).to.equal(project.id);
              expect(audited.actor!.id).to.equal(adminId);
              expect(audited.target!.id).to.equal(inviteID);
            }
          );
        });
      }
    );
  });
});
