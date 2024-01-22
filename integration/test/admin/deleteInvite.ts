import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";
import axios from "axios";

describe("Admin delete invite", function () {
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

    context("And an admin user is logged in to an environment with an outstanding invite", function () {
      const email = "newperson@retraced.io";
      let inviteID;

      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      before(async function () {
        const resp1 = await axios.post(
          `${Env.Endpoint}/admin/v1/project/${project.id}/invite`,
          { email },
          {
            headers: {
              Authorization: jwt,
            },
          }
        );
        assert(resp1);
        inviteID = resp1.data.id;
      });

      context("When the admin deletes the invite", function () {
        let resp;

        before(async function () {
          resp = await axios.delete(`${Env.Endpoint}/admin/v1/project/${project.id}/invite/${inviteID}`, {
            headers: {
              Authorization: jwt,
            },
          });
          assert(resp);
        });

        specify("It should be deleted with status 204.", function () {
          assert.strictEqual(resp.status, 204);
          assert.deepStrictEqual(resp.data, "");
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The deletion is audited under the headless project.", async function () {
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

            assert.strictEqual(audited.action, "invite.delete");
            assert.strictEqual(audited.crud, "d");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
            assert.strictEqual(audited.target!.id, inviteID);
          });
        }
      });
    });
  });
});
