import { expect } from "chai";
import * as Retraced from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";

// tslint:disable-next-line
const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin create template", function () {
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

      context("When a new template is created", function () {
        const reqBody = {
          name: "New Template",
          rule: "always",
          template: "{{}}",
        };
        let resp;

        before(function (done) {
          chai
            .request(Env.Endpoint)
            .post(
              `/admin/v1/project/${project.id}/templates?environment_id=${env.id}`
            )
            .set("Authorization", jwt)
            .send(reqBody)
            .end((err, res) => {
              expect(err).to.be.null;
              resp = res;
              done();
            });
        });

        specify(
          "The template resource is returned with status 201.",
          function () {
            const tenMinutes = 1000 * 60 * 10;
            const now = Date.now();
            const template = resp.body;

            expect(resp).to.have.property("status", 201);

            expect(template.id).to.be.ok;
            expect(template).to.have.property("name", reqBody.name);
            expect(template).to.have.property("rule", reqBody.rule);
            expect(template).to.have.property("template", reqBody.template);
            expect(template).to.have.property("project_id", project.id);
            expect(template).to.have.property("environment_id", env.id);
            expect(new Date(template.created)).to.be.within(
              now - tenMinutes,
              now + tenMinutes
            );
          }
        );

        specify(
          "The creation is audited under the headless project.",
          async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "c",
              action: "template.create",
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

            expect(audited.action).to.equal("template.create");
            expect(audited.crud).to.equal("c");
            expect(audited.group!.id).to.equal(project.id);
            expect(audited.actor!.id).to.equal(adminId);
            expect(audited.target!.id).to.be.ok;
            expect(audited.target!.fields).to.deep.equal(reqBody);
          }
        );
      });
    });
  });
});
