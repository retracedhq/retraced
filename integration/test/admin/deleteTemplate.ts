import { expect } from "chai";
import { Client } from "../../../src/_lib/index";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin delete template", function () {
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

    context("And an admin user is logged in to an environment with a template", function () {
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
          .post(`/admin/v1/project/${project.id}/templates?environment_id=${env.id}`)
          .set("Authorization", jwt)
          .send({
            name: "Delete Template Test",
            rule: "always",
            template: "{{}}",
          })
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res.status).to.equal(201);

            templateID = res.body.id;
            done();
          });
      });

      context("When the admin deletes the template", function () {
        before(function (done) {
          chai
            .request(Env.Endpoint)
            .delete(`/admin/v1/project/${project.id}/templates/${templateID}/?environment_id=${env.id}`)
            .set("Authorization", jwt)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res.status).to.equal(204);
              resp = res;
              done();
            });
        });

        specify("It should be deleted with status 204.", function () {
          expect(resp.status).to.equal(204);
          expect(resp.body).to.deep.equal({});
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The deletion is audited under the headless project.", async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "d",
              action: "template.delete",
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

            expect(audited.action).to.equal("template.delete");
            expect(audited.crud).to.equal("d");
            expect(audited.group!.id).to.equal(project.id);
            expect(audited.actor!.id).to.equal(adminId);
            expect(audited.target!.id).to.equal(templateID);
          });
        }
      });
    });
  });
});
