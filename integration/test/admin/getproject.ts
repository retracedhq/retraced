import * as Env from "../env";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import assert from "assert";
import axios from "axios";

describe("Admin Get Project", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  let jwt;
  let project;
  let env;
  let delReqId;

  // Retraced API is up
  describe("Given the Retraced API is up and running", function () {
    beforeEach(retracedUp(Env));

    // admin user
    context("And an admin user exists with a project pending deletion", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = project.environments[0];
      });

      // with a pending environment deletion
      before(async function () {
        const resp1 = await axios.post(
          `${Env.Endpoint}/admin/v1/project/${project.id}/environment/${env.id}/deletion_request`,
          {
            resourceId: env.id,
            resourceKind: "environment",
          },
          {
            headers: {
              Authorization: jwt,
            },
          }
        );
        assert(resp1);
        delReqId = resp1.data.id;
      });

      context("When a call is made to get the project by id", function () {
        let responseBody;

        before(async function () {
          const resp2 = await axios.get(`${Env.Endpoint}/admin/v1/project/${project.id}`, {
            headers: {
              Authorization: jwt,
            },
          });
          assert(resp2);
          responseBody = resp2.data;
        });

        specify("The response should include the environment with deletion statuses.", function () {
          const delEnv = responseBody.project.environments.find(({ id }) => id === env.id);
          assert.strictEqual(delEnv.deletionRequest.id, delReqId);
          assert.strictEqual(delEnv.deletionRequest.resourceKind, "environment");
        });
      });
    });
  });
});
