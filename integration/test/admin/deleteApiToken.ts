import { expect } from "chai";
import * as Retraced from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin delete API token", function () {
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
  let jwt;
  let token;
  let adminId;

  context("Given the Retraced API is up and running", function () {
    before(retracedUp(Env));

    context("And an admin user is logged in", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        token = admin.project.tokens[0];
        adminId = admin.userId;
      });

      context("When an API token is deleted", function () {
        let resp;

        before(function (done) {
          chai
            .request(Env.Endpoint)
            .delete(`/admin/v1/project/${project.id}/token/${token.token}`)
            .set("Authorization", jwt)
            .end((err, res) => {
              expect(err).to.be.null;
              resp = res;
              done();
            });
        });

        specify("The response succeeds with status 204.", function () {
          expect(resp).to.have.property("status", 204);
          expect(resp.body).to.deep.equal({});
        });

        specify(
          "The deletion is audited under the headless project.",
          async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "d",
              action: "api_token.delete",
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
              },
              group: {
                id: true,
              },
            };
            const connection = await headless.query(query, mask, 1);
            const audited = connection.currentResults[0];

            expect(audited.action).to.equal("api_token.delete");
            expect(audited.crud).to.equal("d");
            expect(audited.group!.id).to.equal(project.id);
            expect(audited.actor!.id).to.equal(adminId);
            expect(audited.target!.id).to.be.ok;
          }
        );
      });
    });
  });
});
