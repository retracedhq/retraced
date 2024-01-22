import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";
import axios from "axios";

describe("Admin delete environment", function () {
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

    context(
      "And an admin user is logged in to a project with an environment that can be deleted",
      function () {
        let templateID;
        let resp;

        before(async function () {
          const admin: any = await adminUser(Env);
          jwt = admin.jwt;
          project = admin.project;
          env = admin.project.environments[0];
          adminId = admin.userId;
        });

        before(async function () {
          resp = await axios.post(
            `${Env.Endpoint}/admin/v1/project/${project.id}/environment/${env.id}/deletion_request`,
            {
              resourceKind: "environment",
              resourceId: env.id,
            },
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp);
          assert.strictEqual(resp.status, 201);
        });

        before(async function () {
          const resp1 = await axios.post(
            `${Env.Endpoint}/admin/v1/project/${project.id}/templates?environment_id=${env.id}`,
            {
              name: "Delete Template Test",
              rule: "always",
              template: "{{}}",
            },
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp1);
          assert.strictEqual(resp1.status, 201);
          templateID = resp1.data.id;
        });

        context("When the admin sends a request to delete the environment", function () {
          before(async function () {
            resp = await axios.delete(
              `${Env.Endpoint}/admin/v1/project/${project.id}/environment/${env.id}`,
              {
                headers: {
                  Authorization: jwt,
                },
              }
            );
            assert(resp);
          });

          specify("The environment is deleted with status 204.", function () {
            assert.strictEqual(resp.status, 204);
            assert.deepEqual(resp.data, "");
          });

          if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
            specify("The deletion is audited under the headless project.", async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);
              const query = {
                crud: "d",
                action: "environment.delete",
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

              assert.strictEqual(audited.action, "environment.delete");
              assert.strictEqual(audited.crud, "d");
              assert.strictEqual(audited.group!.id, project.id);
              assert.strictEqual(audited.actor!.id, adminId);
              assert.strictEqual(audited.target!.id, env.id);
            });
          }
        });
      }
    );
  });
});
