import { expect } from "chai";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";

// tslint:disable-next-line
const chai = require("chai"), chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin create admin token", function () {
  if (!Env.AdminRootToken) {
    return;
  }

  context("Given retraced API is up", function () {
    beforeEach(retracedUp(Env));
    context("And an existing admin user", function () {
      let project;
      let env;
      let jwt;
      let adminId;
      beforeEach(async () => {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });
      context("When an admin token is created", function () {
        let resp;
        beforeEach(async () => {
          resp = await new Promise<any>((resolve, reject) => {
            chai.request(Env.Endpoint)
              .post(`/admin/v1/token`)
              .set("Authorization", jwt)
              .end((err, res) => {
                if (err) {
                  reject(err);
                }
                resolve(res);
              });
          });
        });

        let id;
        let token;
        specify("Then the response should have a token and id", () => {
          id = resp.body.id;
          token = resp.body.token;
          expect(id).not.to.be.empty;
          expect(token).not.to.be.empty;
        });

        context("When the token is used to make an Admin API call (e.g. create a template)", async function () {
          let templateResponse;
          const reqBody = {
            name: "New Template",
            rule: "always",
            template: "{{}}",
          };

          beforeEach(async () => {
            templateResponse = await new Promise<any>((resolve, reject) => {
              chai.request(Env.Endpoint)
                .post(`/admin/v1/project/${project.id}/templates?environment_id=${env.id}`)
                .set("Authorization", `id=${id} token=${token}`)
                .send(reqBody)
                .end((err, res) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve(res);
                });
            });
          });

          specify("Then the response should have a 2xx status", () => {
            expect(templateResponse).to.have.status(201);
          });
        });
      });
    });
  });
});
