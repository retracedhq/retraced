import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import assert from "assert";
import axios from "axios";

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
          resp = await axios.post(`${Env.Endpoint}/admin/v1/token`, null, {
            headers: {
              Authorization: jwt,
            },
          });
        });

        let id;
        let token;
        specify("Then the response should have a token and id", () => {
          id = resp.body.id;
          token = resp.body.token;
          assert(id);
          assert(token);
        });

        context(
          "When the token is used to make an Admin API call (e.g. create a template)",
          async function () {
            let templateResponse;
            const reqBody = {
              name: "New Template",
              rule: "always",
              template: "{{}}",
            };

            beforeEach(async () => {
              templateResponse = axios.post(
                `${Env.Endpoint}/admin/v1/project/${project.id}/templates?environment_id=${env.id}`,
                reqBody,
                {
                  headers: {
                    Authorization: `id=${id} token=${token}`,
                  },
                }
              );
            });

            specify("Then the response should have a 2xx status", () => {
              assert.strictEqual(templateResponse.status, 201);
            });
          }
        );
      });
    });
  });
});
