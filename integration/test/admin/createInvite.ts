import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";
import axios from "axios";

describe("Admin create invite", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Client({
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

    context("And an admin user is logged in", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      context("When a new invite is created", function () {
        const email = "newperson@retraced.io";
        let resp;

        before(async function () {
          resp = await axios.post(
            `${Env.Endpoint}/admin/v1/project/${project.id}/invite`,
            { email },
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp);
        });

        specify("The invite is returned with status 201.", function () {
          assert.strictEqual(resp.status, 201);
          assert(resp.data.id);
          assert.strictEqual(resp.data.project_id, project.id);
          assert.strictEqual(resp.data.email, email);
          assert(resp.data.created);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The creation is audited under the headless project.", async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "c",
              action: "invite.create",
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

            assert.strictEqual(audited.action, "invite.create");
            assert.strictEqual(audited.crud, "c");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
            assert.strictEqual(audited.target!.id, resp.data.id);
            assert.strictEqual(audited.target!.name, email);
          });
        }
      });
    });
  });
});
