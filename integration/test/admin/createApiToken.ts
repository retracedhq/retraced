import { expect } from "chai";
import * as Retraced from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin create API token", function () {
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
              expect(err).to.be.null;
              resp = res;
              done();
            });
        });

        specify("The token resource is returned with status 201.", function () {
          const token = resp.body;
          const tenMinutes = 1000 * 60 * 10;

          expect(resp).to.have.property("status", 201);
          expect(token.token).to.be.ok;
          expect(token.created).to.be.ok;
          expect(new Date(token.created)).to.be.within(Date.now() - tenMinutes, Date.now() + tenMinutes);
          expect(token.name).to.equal(name);
          expect(token.disabled).to.equal(false);
          expect(token.project_id).to.equal(project.id);
          expect(token.environment_id).to.equal(env.id);
        });

        specify("The creation is audited under the headless project.", async function () {
          this.timeout(Env.EsIndexWaitMs * 2);
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
          const token = resp.body;

          expect(audited.action).to.equal("api_token.create");
          expect(audited.crud).to.equal("c");
          expect(audited.group!.id).to.equal(project.id);
          expect(audited.actor!.id).to.equal(adminId);
          expect(audited.target!.id).to.be.ok;
          expect(audited.target!.fields).to.deep.equal({
            name,
            disabled: "false",
          });
        });
      });
    });
  });
});
